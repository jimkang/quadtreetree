function quadtreeToLayoutTree(quadtree, labelPrefix) {
  var idmaker = createIdmaker();

  var prefix = 'tree-';
  if (labelPrefix) {
    prefix = (labelPrefix + '-' + prefix);
  }
  var labeler = createQuadtreeLabeler(prefix);

  var layoutNode = {
    id: labeler.elementIdForNode(quadtree),
    children: [],
    x0: 0,
    y0: 0,
    leaf: quadtree.leaf,
    ghost: quadtree.ghost,    
    sourceNode: quadtree
  };

  for (var i = 0; i < quadtree.nodes.length; ++i) {
    var child = quadtree.nodes[i];
    if (!child) {
      child = {
        label: 'unset_' + idmaker.randomId(4),
        ghost: true,
        nodes: []
      };
    }

    layoutNode.children.push(quadtreeToLayoutTree(child, labelPrefix));
  }

  return layoutNode;
}
