"use strict";
class TinySlider extends HTMLElement {
    static get observedAttributes() {
        return ["showdots"];
    }
    get showDots() {
        return this._showDots;
    }
    set showDots(value) {
        this._showDots = value;
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "showdots") {
            this.showDots = newValue !== null;
        }
    }
    constructor() {
        var _a, _b, _c;
        super();
        this.fill = true;
        this._gap = "0";
        this._transitionDuration = 300;
        this.threshold = 30;
        this._currentIndex = 0;
        this.shown = [];
        this.currentScrollPosition = 0;
        this.maxWidth = 0;
        this.sliderWidth = 0;
        this.reachedEnd = false;
        this.isDragging = false;
        this.passedThreshold = false;
        this.movementStartX = 0;
        this.finalScrollPosition = 0;
        this.dotsContainer = null;
        this._showDots = false;
        this.goTo = (event) => {
            const detail = event.detail;
            if (detail && typeof detail.change === "number") {
                this.setIndex(detail.change);
            }
        };
        this.attachShadow({ mode: "open" });
        this.render();
        this.sliderElement = (_a = this.shadowRoot) === null || _a === void 0 ? void 0 : _a.querySelector(".slider");
        this.contentElement = (_b = this.shadowRoot) === null || _b === void 0 ? void 0 : _b.querySelector(".slider-content");
        this.dotsContainer = (_c = this.shadowRoot) === null || _c === void 0 ? void 0 : _c.querySelector(".dots-container");
        this.initProperties();
        this.createResizeObserver();
        this.bindMethods();
        this.events = [
            {
                type: "mousedown",
                handler: this.down,
                target: this.sliderElement,
            },
            {
                type: "mouseup",
                handler: this.up,
                target: this.sliderElement,
            },
            {
                type: "mousemove",
                handler: this.move,
                target: this.sliderElement,
            },
            {
                type: "touchstart",
                handler: this.down,
                target: this.sliderElement,
            },
            {
                type: "touchend",
                handler: this.up,
                target: this.sliderElement,
            },
            {
                type: "touchmove",
                handler: this.move,
                target: this.sliderElement,
            },
            {
                type: "keydown",
                handler: this.keydown,
                target: document,
            },
        ];
    }
    updateStyles() {
        if (this.contentElement) {
            this.contentElement.style.transition = `transform ${this._transitionDuration}ms`;
            this.contentElement.style.gap = this._gap;
        }
    }
    get gap() {
        return this._gap;
    }
    set gap(value) {
        if (this._gap !== value) {
            this._gap = value;
            this.updateStyles();
        }
    }
    get transitionDuration() {
        return this._transitionDuration;
    }
    set transitionDuration(value) {
        if (this._transitionDuration !== value) {
            this._transitionDuration = value;
            this.updateStyles();
        }
    }
    get currentIndex() {
        return this._currentIndex;
    }
    bindMethods() {
        this.down = this.down.bind(this);
        this.up = this.up.bind(this);
        this.move = this.move.bind(this);
        this.keydown = this.keydown.bind(this);
        this.handleSlotChange = this.handleSlotChange.bind(this);
    }
    toggleEventListeners(add) {
        this.events.forEach((event) => {
            const method = add ? "addEventListener" : "removeEventListener";
            event.target[method](event.type, event.handler, { passive: false });
        });
    }
    connectedCallback() {
        var _a, _b;
        this.toggleEventListeners(true);
        (_b = (_a = this.shadowRoot) === null || _a === void 0 ? void 0 : _a.querySelector("slot")) === null || _b === void 0 ? void 0 : _b.addEventListener("slotchange", this.handleSlotChange);
        this.updateStyles();
        this.setIndex(this._currentIndex);
        this.addEventListener("change-index", this.goTo);
        this.createDots();
    }
    disconnectedCallback() {
        var _a, _b;
        this.toggleEventListeners(false);
        (_b = (_a = this.shadowRoot) === null || _a === void 0 ? void 0 : _a.querySelector("slot")) === null || _b === void 0 ? void 0 : _b.removeEventListener("slotchange", this.handleSlotChange);
        if (this.resizeObserver)
            this.resizeObserver.disconnect();
        if (this.resizeSliderObserver)
            this.resizeSliderObserver.disconnect();
        this.removeEventListener("change-index", this.goTo);
    }
    handleSlotChange() {
        var _a, _b;
        (_b = (_a = this.shadowRoot) === null || _a === void 0 ? void 0 : _a.querySelector("slot")) === null || _b === void 0 ? void 0 : _b.assignedNodes();
    }
    initProperties() {
        this.gap = "0";
        this.fill = true;
        this.transitionDuration = 300;
        this.threshold = 30;
        this._currentIndex = 0;
        this.shown = [];
        this.currentScrollPosition = 0;
        this.maxWidth = 0;
        this.sliderWidth = 0;
        this.reachedEnd = false;
        this.isDragging = false;
        this.passedThreshold = false;
        this.movementStartX = 0;
        this.finalScrollPosition = 0;
    }
    setIndex(index) {
        const totalItems = this.contentElement.children.length;
        const clampedIndex = Math.max(0, Math.min(index, totalItems - 1));
        if (this._currentIndex !== clampedIndex) {
            this._currentIndex = clampedIndex;
            this.adjustPosition();
            this.setShown();
        }
    }
    down(event) {
        if (!this.isCurrentSlider(event))
            return;
        event.preventDefault();
        this.movementStartX =
            event.pageX || event.touches[0].pageX;
        this.isDragging = true;
    }
    move(event) {
        if (!this.isDragging)
            return;
        const newX = event.pageX || event.touches[0].pageX;
        this.finalScrollPosition =
            this.currentScrollPosition + (this.movementStartX - newX);
        this.updateSliderPosition(this.finalScrollPosition);
        this.passedThreshold =
            Math.abs(this.finalScrollPosition - this.currentScrollPosition) >
                this.threshold;
    }
    updateSliderPosition(position) {
        if (this.contentElement) {
            this.contentElement.style.transform = `translateX(-${position}px)`;
        }
    }
    up(event) {
        if (!this.isDragging)
            return;
        if (this.passedThreshold) {
            this.adjustPosition();
        }
        else {
            this.setIndex(this._currentIndex);
        }
        this.updateDots();
        this.isDragging = false;
        this.passedThreshold = false;
    }
    keydown(event) {
        if (!this.isCurrentSlider(document.activeElement))
            return;
        if (event.key != "ArrowLeft" && event.key != "ArrowRight")
            return;
        if (event.key == "ArrowLeft")
            this.setIndex(this._currentIndex - 1);
        if (event.key == "ArrowRight")
            this.setIndex(this._currentIndex + 1);
    }
    adjustPosition() {
        var _a;
        const offsets = (_a = this.getContentChildren()) === null || _a === void 0 ? void 0 : _a.map((item) => item.offsetLeft);
        let targetIndex = this._currentIndex;
        if (this.passedThreshold && (offsets === null || offsets === void 0 ? void 0 : offsets.length)) {
            targetIndex +=
                this.finalScrollPosition > this.currentScrollPosition ? 1 : -1;
            targetIndex = Math.max(0, Math.min(targetIndex, (offsets === null || offsets === void 0 ? void 0 : offsets.length) - 1));
        }
        this._currentIndex = targetIndex;
        this.setScrollPosition(offsets === null || offsets === void 0 ? void 0 : offsets[this._currentIndex], true);
    }
    setScrollPosition(left, limit = false) {
        this.currentScrollPosition = left;
        const end = this.maxWidth - this.sliderWidth;
        this.updateSliderPosition(this.currentScrollPosition);
        this.reachedEnd = this.currentScrollPosition >= end;
        if (!this.reachedEnd)
            return;
        if (this.fill && limit)
            this.currentScrollPosition = end;
        this.updateSliderPosition(this.currentScrollPosition);
    }
    setShown() {
        const offsets = this.getItemOffsets();
        Array.from(offsets).forEach((offset, index) => {
            if (this.currentScrollPosition + this.sliderWidth < offset)
                return;
            if (!this.shown.includes(index))
                this.shown = [...this.shown, index];
        });
    }
    createResizeObserver() {
        this.resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const contentBoxSize = entry.contentBoxSize[0] || entry.contentBoxSize;
                this.maxWidth = contentBoxSize.inlineSize;
            }
        });
        this.resizeObserver.observe(this.contentElement);
        this.resizeSliderObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                if (entry.target === this.sliderElement) {
                    this.sliderWidth = entry.contentRect.width;
                }
            }
        });
        this.resizeSliderObserver.observe(this.sliderElement);
    }
    getItemOffsets() {
        var _a;
        return (_a = this.getContentChildren()) === null || _a === void 0 ? void 0 : _a.map((item) => item.offsetLeft);
    }
    getContentChildren() {
        const slotElement = this.contentElement.querySelector("slot");
        const nodes = slotElement === null || slotElement === void 0 ? void 0 : slotElement.assignedElements();
        return nodes;
    }
    isCurrentSlider(event) {
        return event === null || event === void 0 ? void 0 : event.composedPath().some((el) => { var _a; return (_a = el.classList) === null || _a === void 0 ? void 0 : _a.contains("slider-content"); });
    }
    createDots() {
        var _a;
        if (!this.showDots)
            return;
        const totalItems = this.getContentChildren().length;
        if (!this.dotsContainer) {
            this.dotsContainer = document.createElement("div");
            this.dotsContainer.classList.add("dots-container");
            (_a = this.sliderElement) === null || _a === void 0 ? void 0 : _a.appendChild(this.dotsContainer);
        }
        for (let index = 0; index < totalItems; index++) {
            const dot = document.createElement("button");
            dot.classList.add("dot");
            if (index === this._currentIndex) {
                dot.classList.add("active");
            }
            dot.setAttribute("type", "button");
            dot.setAttribute("aria-current", `${index === this._currentIndex}`);
            dot.addEventListener("click", () => {
                this._currentIndex = index;
                this.adjustPosition();
                this.updateDots();
            });
            this.dotsContainer.appendChild(dot);
        }
    }
    updateDots() {
        if (!this.showDots)
            return;
        const dots = this.dotsContainer.querySelectorAll(".dot");
        dots.forEach((dot, index) => {
            if (index === this._currentIndex) {
                dot.classList.add("active");
            }
            else {
                dot.classList.remove("active");
            }
            dot.setAttribute("aria-current", `${index === this._currentIndex}`);
        });
    }
    render() {
        if (this.shadowRoot)
            this.shadowRoot.innerHTML = `
      <style>
        .slider{overflow-x:hidden;touch-action:pan-y;cursor:grab;position:relative;}
        .slider-content{display:flex;align-items:flex-start;width:fit-content;}
        .grabbing{cursor:grabbing}
        .dots-container {display: flex;justify-content:center;}
        .dot {display:flex;padding:1.25rem 0.5rem;cursor:pointer;background:none;border:none;}
        .dot::before {content:' ';background:gray;width:2rem;height:0.25rem;border-radius:0.25rem;opacity:0.5;}
        .dot.active::before {background:black;}
      </style>
      <div class="slider">
        <div class="slider-content"><slot></slot></div>
        <slot name="controls"></slot>
      </div>`;
    }
}
window.customElements.define("tiny-slider-web-component", TinySlider);
// https://bugs.webkit.org/show_bug.cgi?id=182671
