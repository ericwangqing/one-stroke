
class Graph {
  constructor(canvas, ctx) {
    this.canvas = canvas
    this.ctx = ctx;
    this.vertices = [];
    this.edges = [];
  }

  addVertex(vertex) {
    this.vertices.push(vertex);
  }

  addEdge(edge) {
    this.edges.push(edge);
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.vertices.forEach(vertex => vertex.draw());
    this.edges.forEach(edge => edge.draw())
  }
  // 其他方法
}

class Vertex {
  static sortByX(...vertices) {
    return vertices.sort((v1, v2) => v1.x - v2.x);
  }

  constructor(x, y, name, ctx) {
    this.x = x;
    this.y = y;
    this.name = name;
    this.ctx = ctx;
  }

  draw(color = 'black') {
    this.ctx.beginPath();
    this.ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
    this.ctx.fillStyle = color;
    this.ctx.fill();
    this.ctx.closePath();

    this.ctx.font = "14px Arial";
    this.ctx.fillStyle = color;
    this.ctx.fillText(this.name, this.x - 5, this.y - 10);
  }
}

class Edge {
  constructor(vertex1, vertex2, name, curveFactor, ctx) {
    [vertex1, vertex2] = Vertex.sortByX(vertex1, vertex2)
    this.vertex1 = vertex1;
    this.vertex2 = vertex2;
    this.name = name;
    this.curveFactor = curveFactor;
    this.ctx = ctx

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
    this.ctx.beginPath();
    this.ctx.moveTo(this.vertex1.x, this.vertex1.y);

    this.ctx.quadraticCurveTo(this.controlPoint.x, this.controlPoint.y, this.vertex2.x, this.vertex2.y);
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    this.ctx.closePath();

    const labelPosition = this.getPointOnBezierCurve(0.5);
    this.ctx.font = "14px Arial";
    this.ctx.fillStyle = color;
    this.ctx.fillText(this.name, labelPosition.x - 10, labelPosition.y);
  }

  /**
   * 在贝塞尔曲线中，t 参数是一个标准化的值，范围在0到1之间。
   * t 可以被认为是曲线上的位置，其中 t = 0 表示曲线的起点，t = 1 表示曲线的终点， t = 0.5就是弧顶。
   */
  getPointOnBezierCurve(t) {
    const x = (1 - t) * (1 - t) * this.vertex1.x + 2 * (1 - t) * t * this.controlPoint.x + t * t * this.vertex2.x;
    const y = (1 - t) * (1 - t) * this.vertex1.y + 2 * (1 - t) * t * this.controlPoint.y + t * t * this.vertex2.y;
    return {x, y};
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

export { Graph, Vertex, Edge }