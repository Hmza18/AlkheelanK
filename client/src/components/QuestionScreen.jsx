import { motion } from "framer-motion";

/**
 * Kahoot-style question layout:
 *   top  — meta, question
 *   stage — large image (flexible)
 *   dock — timer (left) + 2×2 answers (right) in landscape / on host desktop
 */
export default function QuestionScreen({
  variant = "player",
  header,
  badge,
  prompt,
  promptTag: PromptTag = "h2",
  image,
  animateImage = false,
  notice = null,
  timer = null,
  answers,
  overlay = null,
  className = "",
}) {
  const rootClass =
    variant === "host"
      ? "question-screen question-screen--host host-phase-fill host-phase-fill--fit alkheelank-screen-host"
      : "question-screen question-screen--player player-phase-fill alkheelank-safe-x mx-auto w-full";

  const ImageEl = animateImage ? motion.img : "img";
  const imageProps = animateImage
    ? {
        initial: { opacity: 0, scale: 0.96 },
        animate: { opacity: 1, scale: 1 },
      }
    : {};

  return (
    <div className={`${rootClass} ${className}`.trim()}>
      <div className="question-screen__body">
        {header}
        {badge}
        <PromptTag className="question-screen__prompt">{prompt}</PromptTag>
        {image ? (
          <div className="question-screen__media">
            <ImageEl {...imageProps} src={image} alt="" className="question-screen__img" />
          </div>
        ) : (
          <div className="question-screen__spacer" aria-hidden />
        )}
        {notice}
      </div>
      <div className="question-screen__dock">
        {timer ? <div className="question-screen__timer">{timer}</div> : null}
        <div className="question-screen__answers">{answers}</div>
      </div>
      {overlay}
    </div>
  );
}
