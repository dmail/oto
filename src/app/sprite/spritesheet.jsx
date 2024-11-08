class MqlSprite extends HTMLElement {
  static tagName = "mql-sprite";
  static observedAttributes = ["url", "x", "y", "width", "height"];

  connectedCallback() {
    const shadow = this.attachShadow({ mode: "open" });
    const canvas = document.createElement("canvas");
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    shadow.appendChild(canvas);
    this.update();
  }

  attributeChangedCallback() {
    if (this.shadowRoot) {
      this.update();
    }
  }

  update() {
    const url = this.getAttribute("url");
    const x = this.getAttribute("x");
    const y = this.getAttribute("y");
    const width = this.getAttribute("width");
    const height = this.getAttribute("height");
    const canvas = this.shadowRoot.querySelector("canvas");
    const image = new Image();
    const context = canvas.getContext("2d");
    image.onload = () => {
      console.log(
        "draw",
        image,
        x,
        y,
        width,
        height,
        canvas.offsetWidth,
        canvas.offsetHeight,
      );
      context.drawImage(
        image,
        parseInt(x),
        parseInt(y),
        parseInt(width),
        parseInt(height),
        0,
        0,
        canvas.offsetWidth,
        canvas.offsetHeight,
      );
    };
    image.src = url;
  }
}
customElements.define(MqlSprite.tagName, MqlSprite);

export const SpriteSheet = (props) => {
  return <mql-sprite {...props} />;
};
