import { motion } from "framer-motion";

export default function SettingToggle({ title, description, active, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`pregame-toggle ${active ? "pregame-toggle--active" : ""}`}
    >
      <div className="pregame-toggle__text">
        <p className="pregame-toggle__title">{title}</p>
        {description ? <p className="pregame-toggle__desc">{description}</p> : null}
      </div>
      <span className={`pregame-toggle__track ${active ? "pregame-toggle__track--on" : ""}`} aria-hidden="true">
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className={`pregame-toggle__thumb ${active ? "pregame-toggle__thumb--on" : ""}`}
        />
      </span>
    </button>
  );
}
