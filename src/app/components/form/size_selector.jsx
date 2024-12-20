import { useEffect } from "preact/hooks";
import { useLocalStorageState } from "/app/hooks/use_local_storage_state.js";

export const SizeSelector = ({
  name,
  onChange,
  min = "0",
  max = "300",
  em,
  ...props
}) => {
  const [typeSelected, typeSelectedSetter] = useLocalStorageState(
    `${name}_type`,
    "auto",
  );
  const [sizeAsNumber, sizeAsNumberSetter] = useLocalStorageState(
    `${name}_number`,
    0,
  );
  const [sizeAsEm, sizeAsEmSetter] = useLocalStorageState(`${name}_em`, 0);

  useEffect(() => {
    if (typeSelected === "auto") {
      onChange("auto");
    } else if (typeSelected === "number") {
      onChange(sizeAsNumber);
    } else if (typeSelected === "em") {
      onChange(`${sizeAsEm}em`);
    }
  }, [typeSelected, sizeAsNumber, sizeAsEm]);

  return (
    <fieldset {...props}>
      <legend>{name}</legend>
      <label>
        <label>
          <input
            name={name}
            type="radio"
            checked={typeSelected === "auto"}
            onInput={(e) => {
              if (e.target.checked) {
                typeSelectedSetter("auto");
              }
            }}
          />
          Auto
        </label>
        <label>
          <input
            name={name}
            type="radio"
            checked={typeSelected === "number"}
            onInput={(e) => {
              if (e.target.checked) {
                typeSelectedSetter("number");
              }
            }}
          />
          Number
          <input
            type="number"
            min={min}
            max={max}
            value={sizeAsNumber}
            onInput={(e) => {
              sizeAsNumberSetter(e.target.valueAsNumber);
            }}
          />
        </label>
        {em && (
          <label>
            Em
            <input
              type="radio"
              name={name}
              checked={typeSelected === "em"}
              onInput={(e) => {
                if (e.target.checked) {
                  typeSelectedSetter("em");
                }
              }}
            />
            <input
              type="number"
              min={em.min}
              max={em.max}
              step="0.1"
              value={sizeAsEm}
              onInput={(e) => {
                sizeAsEmSetter(e.target.valueAsNumber);
              }}
            />
          </label>
        )}
      </label>
    </fieldset>
  );
};
