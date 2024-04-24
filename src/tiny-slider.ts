interface EventConfig {
  type: string;
  handler: EventListener;
  target: EventTarget;
}

class TinySlider extends HTMLElement {
  private sliderElement: HTMLElement;
  private contentElement: HTMLElement;
  private fill: boolean = true;
  private _gap: string = "0";
  private _transitionDuration: number = 300;
  private threshold: number = 30;
  private _currentIndex: number = 0;
  private shown: number[] = [];
  private currentScrollPosition: number = 0;
  private maxWidth: number = 0;
  private sliderWidth: number = 0;
  private reachedEnd: boolean = false;
  private isDragging: boolean = false;
  private passedThreshold: boolean = false;
  private movementStartX: number = 0;
  private finalScrollPosition: number = 0;
  private events: EventConfig[];
  private resizeObserver!: ResizeObserver;
  private resizeSliderObserver!: ResizeObserver;
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.render();
    this.sliderElement = this.shadowRoot?.querySelector(
      ".slider"
    ) as HTMLElement;
    this.contentElement = this.shadowRoot?.querySelector(
      ".slider-content"
    ) as HTMLElement;
    this.initProperties();
    this.createResizeObserver();
    this.bindMethods();
    this.events = [
      {
        type: "mousedown",
        handler: this.down as (event: Event) => void,
        target: this.sliderElement,
      },
      {
        type: "mouseup",
        handler: this.up as (event: Event) => void,
        target: this.sliderElement,
      },
      {
        type: "mousemove",
        handler: this.move as (event: Event) => void,
        target: this.sliderElement,
      },
      {
        type: "touchstart",
        handler: this.down as (event: Event) => void,
        target: this.sliderElement,
      },
      {
        type: "touchend",
        handler: this.up as (event: Event) => void,
        target: this.sliderElement,
      },
      {
        type: "touchmove",
        handler: this.move as (event: Event) => void,
        target: this.sliderElement,
      },
      {
        type: "keydown",
        handler: this.keydown as (event: Event) => void,
        target: document,
      },
    ];
  }

  private updateStyles() {
    if (this.contentElement) {
      this.contentElement.style.transition = `transform ${this._transitionDuration}ms`;
      this.contentElement.style.gap = this._gap;
    }
  }

  public get gap(): string {
    return this._gap;
  }
  public set gap(value: string) {
    if (this._gap !== value) {
      this._gap = value;
      this.updateStyles();
    }
  }

  public get transitionDuration(): number {
    return this._transitionDuration;
  }
  public set transitionDuration(value: number) {
    if (this._transitionDuration !== value) {
      this._transitionDuration = value;
      this.updateStyles();
    }
  }

  public get currentIndex(): number {
    return this._currentIndex;
  }

  private bindMethods() {
    this.down = this.down.bind(this);
    this.up = this.up.bind(this);
    this.move = this.move.bind(this);
    this.keydown = this.keydown.bind(this);
    this.handleSlotChange = this.handleSlotChange.bind(this);
  }

  private toggleEventListeners(add: boolean) {
    this.events.forEach((event) => {
      const method = add ? "addEventListener" : "removeEventListener";
      event.target[method](event.type, event.handler);
    });
  }

  connectedCallback() {
    this.toggleEventListeners(true);
    this.shadowRoot
      ?.querySelector("slot")
      ?.addEventListener("slotchange", this.handleSlotChange);

    this.updateStyles();
    this.setIndex(this._currentIndex);
    this.addEventListener("change-index", this.goTo as EventListener);
  }

  disconnectedCallback() {
    this.toggleEventListeners(false);
    this.shadowRoot
      ?.querySelector("slot")
      ?.removeEventListener("slotchange", this.handleSlotChange);
    if (this.resizeObserver) this.resizeObserver.disconnect();
    if (this.resizeSliderObserver) this.resizeSliderObserver.disconnect();
    this.removeEventListener("change-index", this.goTo as EventListener);
  }

  private goTo = (event: Event): void => {
    const detail = (event as CustomEvent<{ change: number }>).detail;
    if (detail && typeof detail.change === "number") {
      this.setIndex(detail.change);
    }
  };

  private handleSlotChange() {
    this.shadowRoot?.querySelector("slot")?.assignedNodes();
  }

  private initProperties() {
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

  public setIndex(index: number) {
    const totalItems = this.contentElement.children.length;
    const clampedIndex = Math.max(0, Math.min(index, totalItems - 1));

    if (this._currentIndex !== clampedIndex) {
      this._currentIndex = clampedIndex;
      this.adjustPosition();
      this.setShown();
    }
  }

  private down(event: MouseEvent | TouchEvent) {
    if (!this.isCurrentSlider(event)) return;
    event.preventDefault();
    this.movementStartX =
      (event as MouseEvent).pageX || (event as TouchEvent).touches[0].pageX;
    this.isDragging = true;
  }

  private move(event: MouseEvent | TouchEvent) {
    if (!this.isDragging) return;
    const newX =
      (event as MouseEvent).pageX || (event as TouchEvent).touches[0].pageX;
    this.finalScrollPosition =
      this.currentScrollPosition + (this.movementStartX - newX);
    this.updateSliderPosition(this.finalScrollPosition);

    this.passedThreshold =
      Math.abs(this.finalScrollPosition - this.currentScrollPosition) >
      this.threshold;
  }
  private updateSliderPosition(position: number) {
    if (this.contentElement) {
      this.contentElement.style.transform = `translateX(-${position}px)`;
    }
  }
  private up(event: MouseEvent | TouchEvent) {
    if (!this.isDragging) return;
    if (this.passedThreshold) {
      this.adjustPosition();
    } else {
      this.setIndex(this._currentIndex);
    }
    this.isDragging = false;
    this.passedThreshold = false;
  }
  private keydown(event: KeyboardEvent) {
    if (
      !this.isCurrentSlider(document.activeElement as unknown as KeyboardEvent)
    )
      return;

    if (event.key != "ArrowLeft" && event.key != "ArrowRight") return;

    if (event.key == "ArrowLeft") this.setIndex(this._currentIndex - 1);
    if (event.key == "ArrowRight") this.setIndex(this._currentIndex + 1);
  }
  private adjustPosition() {
    const offsets = this.getContentChildren()?.map((item) => item.offsetLeft);
    let targetIndex = this._currentIndex;
    if (this.passedThreshold && offsets?.length) {
      targetIndex +=
        this.finalScrollPosition > this.currentScrollPosition ? 1 : -1;
      targetIndex = Math.max(0, Math.min(targetIndex, offsets?.length - 1));
    }
    this._currentIndex = targetIndex;
    this.setScrollPosition(offsets?.[this._currentIndex], true);
  }
  private setScrollPosition(left: number, limit = false) {
    this.currentScrollPosition = left;
    const end = this.maxWidth - this.sliderWidth;

    this.updateSliderPosition(this.currentScrollPosition);
    this.reachedEnd = this.currentScrollPosition >= end;
    if (!this.reachedEnd) return;

    if (this.fill && limit) this.currentScrollPosition = end;
    this.updateSliderPosition(this.currentScrollPosition);
  }
  private setShown() {
    const offsets = this.getItemOffsets();

    Array.from(offsets).forEach((offset, index) => {
      if (this.currentScrollPosition + this.sliderWidth < offset) return;
      if (!this.shown.includes(index)) this.shown = [...this.shown, index];
    });
  }

  private createResizeObserver() {
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

  private getItemOffsets(): number[] {
    return this.getContentChildren()?.map(
      (item) => item.offsetLeft
    ) as number[];
  }

  private getContentChildren(): HTMLElement[] {
    const slotElement = this.contentElement.querySelector("slot");
    const nodes = slotElement?.assignedElements() as HTMLElement[];
    return nodes;
  }

  private isCurrentSlider(
    event: KeyboardEvent | MouseEvent | TouchEvent
  ): boolean {
    return event
      ?.composedPath()
      .some((el: EventTarget) =>
        (el as HTMLElement).classList?.contains("slider-content")
      );
  }

  private render() {
    if (this.shadowRoot)
      this.shadowRoot.innerHTML = `<style>.slider{overflow-x:hidden;touch-action:pan-y;cursor:grab}.slider-content{display:flex;align-items:flex-start;width:fit-content;transition:transform 300ms;gap:0}.grabbing{cursor:grabbing}</style><div class="slider"><div class="slider-content"><slot></slot></div><slot name="controls"></slot></div>`;
  }
}

window.customElements.define("tiny-slider-web-component", TinySlider);
// https://bugs.webkit.org/show_bug.cgi?id=182671
