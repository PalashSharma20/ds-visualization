// This class can be used to draw straight-line arrows between two coordinates
// Used to draw pointers for createBST
function Arrow(xFrom, yFrom, xTo, yTo, color)
{
	this.arrowHeight = 8;
	this. arrowWidth = 4;

	this.xFrom = xFrom;
  this.yFrom = yFrom;
  this.xTo = xTo;
  this.yTo = yTo;
  this.edgeColor = color;
  this.addedToScene = true;

	this.alpha = 1.0;
	this.color = function color()
	{
		return this.edgeColor;   
	}
	   
	this.drawArrow = function(pensize, color, context)
	{		
    context.strokeStyle = color;
		context.fillStyle = color;
		context.lineWidth = pensize;

		context.beginPath();
    context.moveTo(this.xFrom, this.yFrom);
    context.lineTo(this.xTo, this.yTo);
    context.stroke();

    var xVec = xFrom - xTo;
    var yVec = yFrom - yTo;
    var len = Math.sqrt(xVec * xVec + yVec*yVec);
  
    if (len > 0)
    {
      xVec = xVec / len
      yVec = yVec / len;

      var adjusted_yTo = yTo - this.arrowHeight / 6
      
      context.beginPath();
      context.moveTo(xTo, adjusted_yTo);
      context.lineTo(xTo + xVec*this.arrowHeight - yVec*this.arrowWidth, adjusted_yTo + yVec*this.arrowHeight + xVec*this.arrowWidth);
      context.lineTo(xTo + xVec*this.arrowHeight + yVec*this.arrowWidth, adjusted_yTo + yVec*this.arrowHeight - xVec*this.arrowWidth);
      context.lineTo(xTo, adjusted_yTo);
      context.closePath();
      context.stroke();
      context.fill();
    }
	}
	   
	   
  this.draw = function(ctx)
  {
    if (!this.addedToScene)
    {
      return;
    }
    ctx.globalAlpha = this.alpha;
    this.drawArrow(3, this.edgeColor, ctx);
  }
	   
	   
}