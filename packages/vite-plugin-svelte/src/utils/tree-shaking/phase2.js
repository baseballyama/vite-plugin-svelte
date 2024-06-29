/**
 * Perform dead code elimination for Svelte components using props value information.
 * To avoid creating a sourcemap, this process replaces dead code with spaces.
 */

import { parse } from 'svelte/compiler';
import { walk } from 'zimmerframe';
import MagicString from 'magic-string';
import { DYNAMIC } from './shared.js';

/**
 * @param {string} svelteCode
 * @param {import('../../types/tree-shaking.js').Props[]} propsUsage
 * @returns {string}
 */
export function treeShakeSvelteComponent(svelteCode, propsUsage) {
	const magicString = new MagicString(svelteCode);
	const ast = parse(svelteCode, { modern: true });
	/** @type {{ start: number; end: number }[]} */
	const removedRanges = [];

	/**
	 * @param {number} start
	 * @param {number} end
	 * @returns {string}
	 */
	function asSpace(start, end) {
		return svelteCode.substring(start, end).replace(/\S/g, ' ');
	}

	/**
	 * @param {number} start
	 * @param {number} end
	 */
	function remove(start, end) {
		for (const removedRange of removedRanges) {
			if (start >= removedRange.start && end <= removedRange.end) {
				return;
			}
		}
		removedRanges.push({ start, end });
		magicString.update(start, end, asSpace(start, end));
	}

	walk(
		/** @type {any} */ (ast.fragment),
		{},
		{
			IfBlock(node, { next }) {
				const { test } = node;
				const evaluated = propsUsage.map((props) => {
					return evaluateExpression(test, props);
				});

				let hasTrue = false;
				let hasFalse = false;
				let hasDynamic = false;
				for (const v of evaluated) {
					if (v === true) hasTrue = true;
					if (v === false) hasFalse = true;
					if (v === DYNAMIC) hasDynamic = true;
				}

				if (!hasDynamic) {
					const { consequent, alternate } = node;
					const ifBodyStart = consequent.nodes[0].start;
					const ifBodyEnd = consequent.nodes[consequent.nodes.length - 1].end;
					if (hasTrue && !hasFalse) {
						// Remove {#if xxx}
						remove(node.start, ifBodyStart);
						// Remove after elseif, else blocks and {/if}
						remove(ifBodyEnd, node.end);

						node.alternate = undefined;
					} else if (!hasTrue && hasFalse) {
						// Remove {#if xxx}
						remove(node.start, ifBodyStart);

						// Remove consequent block
						remove(ifBodyStart, ifBodyEnd);
						const alternateFirstChild = alternate.nodes[0];

						if (alternateFirstChild.type === 'IfBlock') {
							const elseIfTestStart = alternateFirstChild.test.start;
							// Replace `{:else if` to `{#if`
							magicString.update(
								ifBodyEnd,
								elseIfTestStart,
								svelteCode.substring(ifBodyEnd, elseIfTestStart).replace('{:else if', '     {#if')
							);
						}

						node.consequent = undefined;
					}
				}

				next();
			}
		}
	);

	return magicString.toString();
}

/**
 * @param {import('estree').Expression} node
 * @param {import('../../types/tree-shaking.js').Props} props
 * @returns {boolean | typeof DYNAMIC}
 */
function evaluateExpression(node, props) {
	if (node.type === 'LogicalExpression') {
		return evaluateLogicalExpression(node, props);
	}
	if (node.type === 'BinaryExpression') {
		return evaluateBinaryExpression(node, props);
	}
	return DYNAMIC;
}

/**
 * @param {import('estree').LogicalExpression} node
 * @param {import('../../types/tree-shaking.js').Props} props
 * @returns {boolean | typeof DYNAMIC}
 */
function evaluateLogicalExpression(node, props) {
	const { left, operator, right } = node;
	const leftValue = getValue(left, props);
	if (leftValue === DYNAMIC) {
		return DYNAMIC;
	}
	const rightValue = getValue(right, props);
	if (rightValue === DYNAMIC) {
		return DYNAMIC;
	}
	return evaluateOperator(
		evaluateExpression(leftValue, props),
		operator,
		evaluateExpression(rightValue, props)
	);
}

/**
 * @param {import('estree').BinaryExpression} node
 * @param {import('../../types/tree-shaking.js').Props} props
 * @returns {boolean | typeof DYNAMIC}
 */
function evaluateBinaryExpression(node, props) {
	const { left, operator, right } = node;
	const leftValue = getValue(left, props);
	if (leftValue === DYNAMIC) {
		return DYNAMIC;
	}
	const rightValue = getValue(right, props);
	if (rightValue === DYNAMIC) {
		return DYNAMIC;
	}

	return evaluate(leftValue, operator, rightValue);
}

/**
 * @param {import('estree').Expression} node
 * @param {import('../../types/tree-shaking.js').Props} props
 * @returns {any | typeof DYNAMIC}
 */
function getValue(node, props) {
	if (node.type === 'Literal') {
		return node.value;
	}
	if (node.type === 'Identifier') {
		if (props === DYNAMIC) {
			return DYNAMIC;
		}
		if (typeof props !== 'symbol') {
			return props[node.name] ?? DYNAMIC;
		}
		return DYNAMIC;
	}
}

/**
 * @param {any} left
 * @param {import ('estree').LogicalOperator} operator
 * @param {any} right
 * @returns {boolean | typeof DYNAMIC}
 */
function evaluateOperator(left, operator, right) {
	switch (operator) {
		case '&&':
			return left && right;
		case '||':
			return left || right;
		default:
			return DYNAMIC;
	}
}

/**
 * @param {any} left
 * @param {import ('estree').BinaryOperator} operator
 * @param {any} right
 * @returns {boolean | typeof DYNAMIC}
 */
function evaluate(left, operator, right) {
	try {
		switch (operator) {
			case '==':
				return left == right;
			case '!=':
				return left != right;
			case '===':
				return left === right;
			case '!==':
				return left !== right;
			case '<':
				return left < right;
			case '<=':
				return left <= right;
			case '>':
				return left > right;
			case '>=':
				return left >= right;
			case '<<':
				return Boolean(left << right);
			case '>>':
				return Boolean(left >> right);
			case '>>>':
				return Boolean(left >>> right);
			case '+':
				return left + right;
			case '-':
				return Boolean(left - right);
			case '*':
				return Boolean(left * right);
			case '/':
				return Boolean(left / right);
			case '%':
				return Boolean(left % right);
			case '**':
				return Boolean(left ** right);
			case '|':
				return Boolean(left | right);
			case '^':
				return Boolean(left ^ right);
			case '&':
				return Boolean(left & right);
			case 'in':
				return left in right;
			case 'instanceof':
				return left instanceof right;
			default:
				return DYNAMIC;
		}
	} catch (e) {
		return DYNAMIC;
	}
}
