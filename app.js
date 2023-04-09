const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');

let vertices = [];
let edges = [];
let isDrawingEdge = false;
let tempEdge = {start: null, end: null};

canvas.addEventListener('mousedown', (event) => {
  const {offsetX, offsetY} = event;
  const vertex = findVertex(offsetX, offsetY);

  if (!vertex) {
    vertices.push({x: offsetX, y: offsetY, edges: []});
    drawVertex(offsetX, offsetY);
  } else {
    if (!isDrawingEdge) {
      tempEdge.start = vertex;
      isDrawingEdge = true;
    } else {
      tempEdge.end = vertex;
      edges.push({start: tempEdge.start, end: tempEdge.end});
      drawEdge(tempEdge.start, tempEdge.end);
      tempEdge.start.edges.push(tempEdge.end);
      tempEdge.end.edges.push(tempEdge.start);
      tempEdge.start = null;
      tempEdge.end = null;
      isDrawingEdge = false;
    }
  }
});

startBtn.addEventListener('click', () => {
  const path = findOneStrokePath(vertices);

  if (path) {
    drawPath(path);
  } else {
    alert('没有找到一笔画路径！');
  }
});

function findVertex(x, y) {
  return vertices.find(v => Math.hypot(v.x - x, v.y - y) <= 10);
}

function drawVertex(x, y) {
  ctx.beginPath();
  ctx.arc(x, y, 10, 0, 2 * Math.PI);
  ctx.fillStyle = 'blue';
  ctx.fill();
}

function drawEdge(start, end) {
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function findOneStrokePath(vertices) {
  const startVertex = vertices.find(v => v.edges.length % 2 !== 0);
  const stack = startVertex ? [startVertex] : [vertices[0]];
  const path = [];

  while (stack.length) {
    const current = stack[stack.length - 1];
    const next = current.edges.pop();
    if (next) {
      stack.push(next);
      const reverseEdgeIndex = next.edges.findIndex(e => e === current);
      if (reverseEdgeIndex !== -1) {
        next.edges.splice(reverseEdgeIndex, 1);
      }
    } else {
      path.push(stack.pop());
    }
  }

  // 检查是否所有顶点都在路径中
  if (path.length !== vertices.length) {
    return null;
  }

  return path;
}

function drawPath(path) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < path.length - 1; i++) {
    drawVertex(path[i].x, path[i].y);
    drawEdge(path[i], path[i + 1]);
  }
  drawVertex(path[path.length - 1].x, path[path.length - 1].y);
}

