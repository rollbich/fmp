class dragger {

	constructor (dragItem, container) {	
	this.dragItem = document.querySelector(`#${dragItem}`);
    this.container = document.querySelector(`#${container}`);

    this.active = false;
    this.currentX;
    this.currentY;
    this.initialX;
    this.initialY;
    this.xOffset = 0;
    this.yOffset = 0;

    this.container.addEventListener("touchstart", evt => this.dragStart(evt), false);
    this.container.addEventListener("touchend", evt => this.dragEnd(evt), false);
    this.container.addEventListener("touchmove", evt => this.drag(evt), false);

    this.container.addEventListener("mousedown", evt => this.dragStart(evt), false);
    this.container.addEventListener("mouseup", evt => this.dragEnd(evt), false);
    this.container.addEventListener("mousemove", evt => this.drag(evt), false);
	}

	dragStart(e) {
		if (e.type === "touchstart") {
			this.initialX = e.touches[0].clientX - this.xOffset;
			this.initialY = e.touches[0].clientY - this.yOffset;
		} else {
			this.initialX = e.clientX - this.xOffset;
			this.initialY = e.clientY - this.yOffset;
		}

		if (e.target === this.dragItem) {
			this.active = true;
		}
	}

	dragEnd(e) {
		this.initialX = this.currentX;
		this.initialY = this.currentY;
		this.active = false;
	}

	drag(e) {
		if (this.active) {  
		  e.preventDefault();
		  if (e.type === "touchmove") {
			this.currentX = e.touches[0].clientX - this.initialX;
			this.currentY = e.touches[0].clientY - this.initialY;
		  } else {
			this.currentX = e.clientX - this.initialX;
			this.currentY = e.clientY - this.initialY;
		  }
		  this.xOffset = this.currentX;
		  this.yOffset = this.currentY;
		  this.setTranslate(this.currentX, this.currentY, this.dragItem);
		}
	}

	setTranslate(xPos, yPos, el) {
		el.style.transform = "translate3d(" + xPos + "px, " + yPos + "px, 0)";
	}
}