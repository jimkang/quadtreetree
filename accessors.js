var accessors = ((function accessors() {
  function accessorFunctor(property) {
    return function accessProperty(d) {
      return d[property];
    }
  }

  var cache = {
    id: accessorFunctor('id'),
    targetId: function targetId(d) {
      return d.target.id;
    },
    color: accessorFunctor('color'),
    translateToPosition0: function transform0(d) {
      return 'translate(' + d.x0 + ',' + d.y0 + ')';
    },
    translateToPosition: function translateToPosition(d) {
      return 'translate(' + d.x + ',' + d.y + ')';
    }
  };

  return cache;
})());
