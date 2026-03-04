export class DataStructures {
    static convertTaxonomyToD3(adjacencyList) {
        const result = { name: Object.keys(adjacencyList)[0], children: [] };
        const visited = {};

        function dfs(node) {
            if (!visited[node]) {
                visited[node] = true;
                const children = adjacencyList[node];
                if (children) {
                    if (children.length === 0) {
                        return { name: node };
                    }
                    let childNodes = children.map(child => dfs(child));
                    childNodes = childNodes.filter(child => child !== undefined)
                    return {name: node, children: childNodes};
                }
            }
        }

        result.children = adjacencyList[result.name].map(child => dfs(child));
        result.children = result.children.filter(child => child !== undefined)
        return result;
    }

    static getNodesWithDepth(tree, root) {
        let result = {};
        let maxDepth = 0
        calculateDepth(tree, root, 0, result, maxDepth);
        return result;
    }

}

function calculateDepth(tree, root, depth, result, visited, maxDepth) {
    if (result[root] !== undefined && result[root] >= depth) return;
    result[root] = depth;

    if (tree[root]) {
        for (let node of tree[root]) {
            maxDepth = Math.max(maxDepth, calculateDepth(tree, node, depth + 1, result, maxDepth));
        }
    }
    return maxDepth
}