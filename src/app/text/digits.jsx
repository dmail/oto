import { Text } from "./text.jsx";

export const Digits = ({ children }) => {
  return (
    <Text size={10} color="white" outlineColor="black" letterSpacing={-1}>
      {children}
    </Text>
  );
};
