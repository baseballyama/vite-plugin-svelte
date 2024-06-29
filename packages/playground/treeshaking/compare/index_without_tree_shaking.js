import {
	c as comment,
	i as if_block,
	a as append,
	t as template,
	f as first_child,
	m as mount
} from './vendor-CjCr5kEU.js';
(function polyfill() {
	const relList = document.createElement('link').relList;
	if (relList && relList.supports && relList.supports('modulepreload')) {
		return;
	}
	for (const link of document.querySelectorAll('link[rel="modulepreload"]')) {
		processPreload(link);
	}
	new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			if (mutation.type !== 'childList') {
				continue;
			}
			for (const node of mutation.addedNodes) {
				if (node.tagName === 'LINK' && node.rel === 'modulepreload') processPreload(node);
			}
		}
	}).observe(document, { childList: true, subtree: true });
	function getFetchOpts(link) {
		const fetchOpts = {};
		if (link.integrity) fetchOpts.integrity = link.integrity;
		if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
		if (link.crossOrigin === 'use-credentials') fetchOpts.credentials = 'include';
		else if (link.crossOrigin === 'anonymous') fetchOpts.credentials = 'omit';
		else fetchOpts.credentials = 'same-origin';
		return fetchOpts;
	}
	function processPreload(link) {
		if (link.ep) return;
		link.ep = true;
		const fetchOpts = getFetchOpts(link);
		fetch(link.href, fetchOpts);
	}
})();
var root_2 = template(`Inner1-1`, 1);
var root_4 = template(`Inner1-2`, 1);
var root_5 = template(`Inner1-3`, 1);
var root_8 = template(`Inner2-1`, 1);
var root_10 = template(`Inner2-2`, 1);
var root_11 = template(`Inner2-3`, 1);
var root_12 = template(`<p>Hello!</p>`);
function Counter($$anchor, $$props) {
	var fragment = comment();
	var node = first_child(fragment);
	if_block(
		node,
		() => $$props.initialCount < 0,
		($$anchor2) => {
			var fragment_1 = comment();
			var node_1 = first_child(fragment_1);
			if_block(
				node_1,
				() => $$props.initialCount < 0,
				($$anchor3) => {
					var fragment_2 = root_2();
					append($$anchor3, fragment_2);
				},
				($$anchor3) => {
					var fragment_3 = comment();
					var node_2 = first_child(fragment_3);
					if_block(
						node_2,
						() => $$props.initialCount > 0,
						($$anchor4) => {
							var fragment_4 = root_4();
							append($$anchor4, fragment_4);
						},
						($$anchor4) => {
							var fragment_5 = root_5();
							append($$anchor4, fragment_5);
						},
						true
					);
					append($$anchor3, fragment_3);
				}
			);
			append($$anchor2, fragment_1);
		},
		($$anchor2) => {
			var fragment_6 = comment();
			var node_3 = first_child(fragment_6);
			if_block(
				node_3,
				() => $$props.initialCount > 0,
				($$anchor3) => {
					var fragment_7 = comment();
					var node_4 = first_child(fragment_7);
					if_block(
						node_4,
						() => $$props.initialCount < 0,
						($$anchor4) => {
							var fragment_8 = root_8();
							append($$anchor4, fragment_8);
						},
						($$anchor4) => {
							var fragment_9 = comment();
							var node_5 = first_child(fragment_9);
							if_block(
								node_5,
								() => $$props.initialCount > 0,
								($$anchor5) => {
									var fragment_10 = root_10();
									append($$anchor5, fragment_10);
								},
								($$anchor5) => {
									var fragment_11 = root_11();
									append($$anchor5, fragment_11);
								},
								true
							);
							append($$anchor4, fragment_9);
						}
					);
					append($$anchor3, fragment_7);
				},
				($$anchor3) => {
					var p = root_12();
					append($$anchor3, p);
				},
				true
			);
			append($$anchor2, fragment_6);
		}
	);
	append($$anchor, fragment);
}
function App($$anchor) {
	var fragment = comment();
	var node = first_child(fragment);
	Counter(node, { initialCount: 1 });
	append($$anchor, fragment);
}
mount(App, {
	props: {},
	target: document.getElementById('app')
});
