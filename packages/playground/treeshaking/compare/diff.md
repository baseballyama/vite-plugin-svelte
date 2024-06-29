```diff
diff --git a/packages/playground/treeshaking/compare/index_without_tree_shaking.js b/packages/playground/treeshaking/compare/index_with_tree_shaking.js
index d873257d..a0bc9c7c 100644
--- a/packages/playground/treeshaking/compare/index_without_tree_shaking.js
+++ b/packages/playground/treeshaking/compare/index_with_tree_shaking.js
@@ -1,11 +1,10 @@
 import {
-	c as comment,
-	i as if_block,
 	a as append,
 	t as template,
+	c as comment,
 	f as first_child,
 	m as mount
-} from './vendor-CjCr5kEU.js';
+} from './vendor-CWxgFfOZ.js';
 (function polyfill() {
 	const relList = document.createElement('link').relList;
 	if (relList && relList.supports && relList.supports('modulepreload')) {
@@ -40,102 +39,15 @@ import {
 		fetch(link.href, fetchOpts);
 	}
 })();
-var root_2 = template(`Inner1-1`, 1);
-var root_4 = template(`Inner1-2`, 1);
-var root_5 = template(`Inner1-3`, 1);
-var root_8 = template(`Inner2-1`, 1);
-var root_10 = template(`Inner2-2`, 1);
-var root_11 = template(`Inner2-3`, 1);
-var root_12 = template(`<p>Hello!</p>`);
+var root = template(`Inner2-2`, 1);
 function Counter($$anchor, $$props) {
-	var fragment = comment();
-	var node = first_child(fragment);
-	if_block(
-		node,
-		() => $$props.initialCount < 0,
-		($$anchor2) => {
-			var fragment_1 = comment();
-			var node_1 = first_child(fragment_1);
-			if_block(
-				node_1,
-				() => $$props.initialCount < 0,
-				($$anchor3) => {
-					var fragment_2 = root_2();
-					append($$anchor3, fragment_2);
-				},
-				($$anchor3) => {
-					var fragment_3 = comment();
-					var node_2 = first_child(fragment_3);
-					if_block(
-						node_2,
-						() => $$props.initialCount > 0,
-						($$anchor4) => {
-							var fragment_4 = root_4();
-							append($$anchor4, fragment_4);
-						},
-						($$anchor4) => {
-							var fragment_5 = root_5();
-							append($$anchor4, fragment_5);
-						},
-						true
-					);
-					append($$anchor3, fragment_3);
-				}
-			);
-			append($$anchor2, fragment_1);
-		},
-		($$anchor2) => {
-			var fragment_6 = comment();
-			var node_3 = first_child(fragment_6);
-			if_block(
-				node_3,
-				() => $$props.initialCount > 0,
-				($$anchor3) => {
-					var fragment_7 = comment();
-					var node_4 = first_child(fragment_7);
-					if_block(
-						node_4,
-						() => $$props.initialCount < 0,
-						($$anchor4) => {
-							var fragment_8 = root_8();
-							append($$anchor4, fragment_8);
-						},
-						($$anchor4) => {
-							var fragment_9 = comment();
-							var node_5 = first_child(fragment_9);
-							if_block(
-								node_5,
-								() => $$props.initialCount > 0,
-								($$anchor5) => {
-									var fragment_10 = root_10();
-									append($$anchor5, fragment_10);
-								},
-								($$anchor5) => {
-									var fragment_11 = root_11();
-									append($$anchor5, fragment_11);
-								},
-								true
-							);
-							append($$anchor4, fragment_9);
-						}
-					);
-					append($$anchor3, fragment_7);
-				},
-				($$anchor3) => {
-					var p = root_12();
-					append($$anchor3, p);
-				},
-				true
-			);
-			append($$anchor2, fragment_6);
-		}
-	);
+	var fragment = root();
 	append($$anchor, fragment);
 }
 function App($$anchor) {
 	var fragment = comment();
 	var node = first_child(fragment);
-	Counter(node, { initialCount: 1 });
+	Counter(node);
 	append($$anchor, fragment);
 }
 mount(App, {
```
