export const Checkbox = ({ children, checked, onChange }) => {
  return (
    <label>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => {
          if (e.target.checked) {
            onChange(true);
          } else {
            onChange(false);
          }
        }}
      />
      {children}
    </label>
  );
};
