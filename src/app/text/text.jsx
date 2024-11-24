const zeroSvgUrl = import.meta.resolve("./font/numbers/0.svg");
const oneSvgUrl = import.meta.resolve("./font/numbers/1.svg");

const charUrls = {
  0: zeroSvgUrl,
  1: oneSvgUrl,
};

export const Text = ({ children }) => {
  return (
    <svg>
      {children.map((child, index) => {
        const url = charUrls[child];
        if (url) {
          return <use key={index} href={`${url}#layer_1`} alt={child} />;
        }
        return <rect key={index} />;
      })}
    </svg>
  );
};
