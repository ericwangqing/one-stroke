const canvas = document.getElementById('drawingArea');
const ctx = canvas.getContext('2d');
const restartDrawingBtn = document.getElementById('restartDrawing');
const restartGraphBtn = document.getElementById('restartGraph');

class Graph {
  constructor() {
    this.vertices = [];
    this.edges = [];
  }

  addVertex(vertex) {
    this.vertices.push(vertex);
  }

  addEdge(edge) {
    this.edges.push(edge);
  }

  // 其他方法
}

class Vertex {
  constructor(x, y, name) {
    this.x = x;
    this.y = y;
    this.name = name;
  }

  draw(color = 'black') {
    ctx.beginPath();
    ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.closePath();

    ctx.font = "14px Arial";
    ctx.fillStyle = color;
    ctx.fillText(this.name, this.x - 5, this.y - 10);
  }
}

class Edge {
  constructor(vertex1, vertex2, name, curveFactor) {
    this.vertex1 = vertex1;
    this.vertex2 = vertex2;
    this.name = name;
    this.curveFactor = curveFactor;

    const midX = (vertex1.x + vertex2.x) / 2;
    const midY = (vertex1.y + vertex2.y) / 2;
    const dx = vertex2.x - vertex1.x;
    const dy = vertex2.y - vertex1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    this.controlPoint = {
      x: midX + curveFactor * dy / distance,
      y: midY - curveFactor * dx / distance,
    };
  }

  draw(color = 'black') {
    ctx.beginPath();
    ctx.moveTo(this.vertex1.x, this.vertex1.y);

    ctx.quadraticCurveTo(this.controlPoint.x, this.controlPoint.y, this.vertex2.x, this.vertex2.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();

    const labelPosition = this.getPointOnBezierCurve(0.5);
    ctx.font = "14px Arial";
    ctx.fillStyle = color;
    ctx.fillText(this.name, labelPosition.x - 10, labelPosition.y);
  }

  /**
   * 在贝塞尔曲线中，t 参数是一个标准化的值，范围在0到1之间。
   * t 可以被认为是曲线上的位置，其中 t = 0 表示曲线的起点，t = 1 表示曲线的终点， t = 0.5就是弧顶。
   */
  getPointOnBezierCurve(t) {
    const x = (1 - t) * (1 - t) * this.vertex1.x + 2 * (1 - t) * t * this.controlPoint.x + t * t * this.vertex2.x;
    const y = (1 - t) * (1 - t) * this.vertex1.y + 2 * (1 - t) * t * this.controlPoint.y + t * t * this.vertex2.y;
    return { x, y };
  }

  pointToEdgeDistance(x, y) {
    const segments = 100;
    let minDistance = Infinity;

    for (let i = 0; i < segments; i++) {
      const t1 = i / segments;
      const t2 = (i + 1) / segments;

      const startPoint = this.getPointOnBezierCurve(t1);
      const endPoint = this.getPointOnBezierCurve(t2);

      const dx = endPoint.x - startPoint.x;
      const dy = endPoint.y - startPoint.y;
      const d = Math.sqrt(dx * dx + dy * dy);

      const t = ((x - startPoint.x) * dx + (y - startPoint.y) * dy) / (d * d);
      const closestPointOnLine = t < 0 ? startPoint : t > 1 ? endPoint : {
        x: startPoint.x + t * dx,
        y: startPoint.y + t * dy,
      };

      const distance = Math.sqrt(Math.pow(x - closestPointOnLine.x, 2) + Math.pow(y - closestPointOnLine.y, 2));
      minDistance = Math.min(minDistance, distance);
    }

    return minDistance;
  }

}

// 具体实现游戏逻辑，例如添加顶点、边、检测点击位置等
// ... 其他代码 ...

class App {
  constructor() {
    this.graph = new Graph();
    this.selectedVertices = [];

    this.isDrawingMode = false;
    this.currentVertex = null;
    this.visitedEdges = [];

    this.stepsContainer = document.getElementById('stepsContainer');
    this.init();
  }

  get vertexCounter() {
    return this.graph.vertices.length;
  }

  get edgeCounter() {
    return this.graph.edges.length;
  }

  get currentEdge() {
    return this.visitedEdges.slice(-1)[0];
  }

  init() {
    canvas.addEventListener('click', (event) => this.handleCanvasClick(event));
  }

  handleCanvasClick(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    if (this.isDrawingMode) {
      if (!this.currentVertex) { // 开画时，先点击开始顶点
        this.currentVertex = this.findVertex(x, y);
        this.logStep(true);
      } else {
        const clickedEdge = this.findEdge(x, y);
        if (clickedEdge) {
          this.handleEdgeClick(clickedEdge);
        }
      }
      this.drawCurrentVertexAndPossibleEdges();
    } else {
      const clickedVertex = this.findVertex(x, y);

      if (clickedVertex) {
        this.handleVertexClick(clickedVertex);
      } else {
        this.addVertex(x, y);
      }
    }
  }

  logStep(begin=false, msg='') {
    const step = document.createElement('li');
    step.innerHTML = msg || (begin ?  `出发：${this.currentVertex.name}` :
      this.currentEdge.vertex1 === this.currentVertex ? `${this.currentEdge.vertex2.name} → ${this.currentVertex.name}` :
      `${this.currentEdge.vertex1.name} → ${this.currentVertex.name}`);
    this.stepsContainer.appendChild(step);
  }

  findVertex(x, y) {
    return this.graph.vertices.find(vertex => Math.sqrt(Math.pow(vertex.x - x, 2) + Math.pow(vertex.y - y, 2)) < 10);
  }

  handleVertexClick(clickedVertex) {
    if (this.selectedVertices.length === 0) {
      this.selectedVertices.push(clickedVertex);
    } else if (this.selectedVertices.length === 1) {
      const vertex1 = this.selectedVertices[0];
      const vertex2 = clickedVertex;

      if (vertex1 !== vertex2) {
        this.addEdge(vertex1, vertex2);
        this.selectedVertices = [];
      }
    }
  }

  addVertex(x, y) {
    if (this.vertexCounter >= 26) {
      alert('顶点数量已达上限(26)');
      return;
    }
    const vertexName = String.fromCharCode(65 + this.vertexCounter); // 65 is ASCII code of 'A'
    const vertex = new Vertex(x, y, vertexName);
    this.graph.addVertex(vertex);
    vertex.draw();
  }

  addEdge(vertex1, vertex2) {
    if (this.edgeCounter >= 100) {
      alert('边数量已达上限(100)');
      return;
    }

    const existingEdges = this.graph.edges.filter(edge => (
      (edge.vertex1 === vertex1 && edge.vertex2 === vertex2) ||
      (edge.vertex1 === vertex2 && edge.vertex2 === vertex1)
    ));
    const edgeCount = existingEdges.length;
    const scale = 40
    const curveFactor = this.getCurveFactor(edgeCount, scale);

    // const curveFactor = 40 * (1 + 2 * (existingEdges.length % 2) - 1);

    const edge = new Edge(vertex1, vertex2, this.edgeCounter + 1, curveFactor);
    this.graph.addEdge(edge);
    edge.draw();
  }

  /**
   * curveFactor is scale multiply a sequence like 0, 1, -1, 2, -2, 3, -3, ...
   * that make curves layout at both sides of the edge line
   */
  getCurveFactor(edgeCount, scale) {
    // halfCurveCount is the number of curves at one side of the edge line: 1, 1, 2, 2, 3, 3, ...
    const halfCurveCount = edgeCount % 2 === 0 ? edgeCount / 2 : (edgeCount + 1) / 2;
    // make it into a sequence like                                         0, 1, 1, 2, 2, 3, 3 ...
    const factor = edgeCount === 0 ? 0 : edgeCount % 2 === 0 ? -halfCurveCount : halfCurveCount;
    return scale * factor;
  }

// 其他方法，例如实现一笔画功能
  startDrawing() {
    this.isDrawingMode = true;
  }

  restartDrawing() {
    this.currentVertex = null;
    this.visitedEdges = [];
    this.redraw();
    this.isDrawingMode = true;
    this.logStep(false, '--- 重新开始 ---');
  }

  redraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.graph.vertices.forEach(vertex => vertex.draw());
    this.graph.edges.forEach(edge => edge.draw())
  }

  findEdge(x, y) {
    const dists = this.graph.edges.map(edge => edge.pointToEdgeDistance(x, y)

    )
    const minDist = Math.min(...dists)
    return minDist < 5 ? this.graph.edges[dists.indexOf(minDist)] : null;
  }

  handleEdgeClick(clickedEdge) {
    if (!this.visitedEdges.includes(clickedEdge)) {
      const { vertex1, vertex2 } = clickedEdge;
      if (this.currentVertex === vertex1 || this.currentVertex === vertex2) {
        this.visitEdge(clickedEdge);
        this.currentVertex = this.currentVertex === vertex1 ? vertex2 : vertex1;
        this.logStep();

        setTimeout(_ => { // wait a moment to show the last edge
          if (this.isDrawingFinished()) {
            alert('恭喜！你成功完成了一笔画。');
            this.logStep(false, '--- 成功 ---')
          } else if (this.isDrawingFailed()) {
            alert('无路可走，一笔画失败。');
            this.logStep(false, '--- 失败 ---')
          }
        }, 300)
       }
    }
  }

  visitEdge(edge) {
    this.visitedEdges.push(edge);
    edge.draw('blue');
    // redraw all non-visited edges, possible edges with black color, other impossible edges with gray color
  }

  drawCurrentVertexAndPossibleEdges() {
    this.graph.vertices.forEach(vertex => {
      vertex === this.currentVertex ? vertex.draw('black') : vertex.draw('lightgray')
    })

    this.graph.edges.forEach(edge => {
      if (!this.visitedEdges.includes(edge)) {
        this.canVisit(edge) ? edge.draw('black') : edge.draw('lightgray');
      }
    })
  }

  isDrawingFinished() {
    return this.visitedEdges.length === this.graph.edges.length;
  }

  isDrawingFailed() {
    return !this.graph.edges.some(edge => {
      return (edge.vertex1 === this.currentVertex || edge.vertex2 === this.currentVertex) && !this.visitedEdges.includes(edge);
    });
  }

  restartGraph() {
    this.graph = new Graph();
    this.selectedVertices = [];
    this.isDrawingMode = false;
    this.currentVertex = null;
    this.visitedEdges = [];
    this.redraw();
    this.stepsContainer.innerHTML = '';
  }

  canVisit(edge) {
    const { vertex1, vertex2 } = edge;
    return this.currentVertex === vertex1 || this.currentVertex === vertex2;
  }
}

const app = new App();

const startDrawingBtn = document.getElementById('startDrawing');
startDrawingBtn.addEventListener('click', () => {
  app.startDrawing();
});

restartDrawingBtn.addEventListener('click', () => {
  app.restartDrawing();
});

restartGraphBtn.addEventListener('click', () => {
  app.restartGraph();
});
