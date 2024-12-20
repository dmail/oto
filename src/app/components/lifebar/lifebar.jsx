export const Lifebar = ({
  value,
  max,
  fullColor = "yellow",
  emptyColor = "red",
}) => {
  if (max <= 40) {
    const bars = createBars(value, 40);
    return (
      <LifebarSvg
        bars={bars}
        barWidth={2}
        maxBars={40}
        fullColor={fullColor}
        emptyColor={emptyColor}
      />
    );
  }
  const moduloResult = value % 40;
  let numbersOfSmallBarsFilled;
  let numberOfMediumBarsFilled;
  if (moduloResult === 0) {
    numbersOfSmallBarsFilled = value <= 40 ? value : 40;
    numberOfMediumBarsFilled = value <= 40 ? 0 : Math.floor((value - 40) / 40);
  } else {
    numbersOfSmallBarsFilled = moduloResult;
    numberOfMediumBarsFilled = Math.floor(value / 40);
  }
  const smallBars = createBars(numbersOfSmallBarsFilled, 40);
  const numbersOfMediumBars = Math.floor((max - 40) / 40);
  if (numbersOfMediumBars <= 20) {
    const mediumBars = createBars(
      numberOfMediumBarsFilled,
      numbersOfMediumBars,
    );
    return (
      <div style="display: flex; flex-direction: column; width: 100%; height: 100%">
        <div style="height: 70%">
          <LifebarSvg
            bars={smallBars}
            maxBars={40}
            barWidth={2}
            emptyColor={emptyColor}
            fullColor={fullColor}
          />
        </div>
        <div style="height: 30%; padding-top: 1px">
          <div style="height: 100%">
            <LifebarSvg
              bars={mediumBars}
              maxBars={20}
              barWidth={5}
              emptyColor={emptyColor}
              fullColor={fullColor}
            />
          </div>
        </div>
      </div>
    );
  }
  const mediumBarsFirstRow = createBars(numberOfMediumBarsFilled, 20);
  const mediumBarsSecondRow = createBars(
    numberOfMediumBarsFilled - 20,
    numbersOfMediumBars - 20,
  );
  return (
    <div style="display: flex; flex-direction: column; width: 100%; height: 100%">
      <div style="height: 30%">
        <LifebarSvg
          bars={smallBars}
          barWidth={2}
          maxBars={40}
          emptyColor={emptyColor}
          fullColor={fullColor}
        />
      </div>
      <div style="height: 60%;">
        <div style="height: 50%; padding-top: 1px">
          <div style="height: 100%">
            <LifebarSvg
              bars={mediumBarsFirstRow}
              maxBars={20}
              barWidth={5}
              emptyColor={emptyColor}
              fullColor={fullColor}
            />
          </div>
        </div>
        <div style="height: 50%; padding-top: 1px">
          <div style="height: 100%">
            <LifebarSvg
              bars={mediumBarsSecondRow}
              maxBars={20}
              barWidth={5}
              emptyColor={emptyColor}
              fullColor={fullColor}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const createBars = (filledCount, totalCount) => {
  const bars = [];
  let i = 0;
  while (i < totalCount) {
    bars.push({
      from: i,
      to: i + 1,
      filled: i < filledCount,
    });
    i++;
  }
  return bars;
};

const LifebarSvg = ({
  barWidth,
  bars,
  maxBars,
  barSpacing = 1,
  fullColor,
  emptyColor,
}) => {
  const totalWidth = maxBars * (barWidth + barSpacing);

  return (
    <svg
      viewBox={`0 0 ${totalWidth} 100`}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
      style={{
        display: "flex",
        alignSelf: "center",
        height: "100%",
        maxWidth: "100%",
        maxHeight: "30px",
        aspectRatio: `10/1`,
      }}
    >
      <g>
        {bars.map((bar, index) => {
          const x = index * (barWidth + barSpacing);
          return (
            <rect
              key={index}
              name={`life_${bar.from}:${bar.to}`}
              x={x}
              y="0"
              width={barWidth}
              height="100"
              fill={bar.filled ? fullColor : emptyColor}
            ></rect>
          );
        })}
      </g>
    </svg>
  );
};
