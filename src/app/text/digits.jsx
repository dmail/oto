import { Text } from "./text.jsx";

export const Digits = ({ children }) => {
  return (
    <Text size={10} color="white" fontFamily="goblin" outlineColor="black">
      {children}
    </Text>
  );
};
