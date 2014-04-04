function exhibitController() {
  var exhibit = {
    points: [],
    displayedPointRange: [0, 100],
    maxNumberOfPoints: 1000,
    padding: 8,
    detailsBox: d3.select('.details-box')
  };

  var boardWidth = 0;
  var boardHeight = 0;

  ((function captureBoardDimensions() {
    var boardEl = d3.select('#quadtreetree').node();

    boardWidth = boardEl.clientWidth;
    if (boardWidth < 1) {
      // This is necessary on Firefox.
      boardWidth = boardEl.parentElement.clientWidth;
    }

    boardHeight = boardEl.clientHeight;
    if (boardHeight < 1) {
      // This is necessary on Firefox.
      boardHeight = boardEl.parentElement.clientHeight;
    }

    boardWidth -= (2 * exhibit.padding);
    boardHeight -= (2 * exhibit.padding);
  })());

  function createPointRandomly() {
    return [
      ~~(Math.random() * boardWidth),
      ~~(Math.random() * boardHeight)
    ];
  }

  exhibit.displayedPoints = function displayedPoints() {
    return exhibit.points.slice(
      exhibit.displayedPointRange[0], exhibit.displayedPointRange[1]);
  };

  exhibit.points = d3.range(exhibit.maxNumberOfPoints).map(createPointRandomly);
  
  exhibit.quadtree = exampleQuadtree(boardWidth, boardHeight, 
    exhibit.displayedPoints());

  exhibit.quadtreetree = createQuadtreetree({
    rootSelector: '#treeroot'
  });

  var camera = createCamera('#quadtreetree', '#treeroot', [0.2, 2]);

  document.addEventListener('quadtreetree-dotsEntered', zoomToDots);

  function zoomToDots(event) {
    var dots = event.detail;
    // Pan to one of the new dots.
    setTimeout(function pan() {
      camera.panToElement(dots, 750);
    },
    750);
  }

  document.addEventListener('quadtreetree-nodeSelected', reportSelectedNode);

  function reportSelectedNode(e) {
    var report = quadtreeNodeReport(e.detail.sourceNode);
    exhibit.detailsBox.text(JSON.stringify(report, null, '  '));    
  }

  exhibit.quadtreetree.update(exhibit.quadtree);

  return exhibit;
}

var theExhibit = exhibitController();
