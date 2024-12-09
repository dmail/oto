import { Button } from "/app/components/button/button.jsx";

export const MenuFight = ({ onAttack }) => {
  return (
    <Button
      y="end"
      onClick={() => {
        onAttack();
      }}
    >
      Attaque
    </Button>
  );
};
