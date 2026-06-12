import { motion } from "framer-motion";
import { fadeUp, spring } from "../lib/motion.js";

/**
 * Kahoot-style question layout:
 *   top   — countdown strip, question bar
 *   stage — large photo (center)
 *   dock  — full-width answer grid (2×2, or 1×2 for true/false)
 */
export default function QuestionScreen({
  variant = "player",
  questionType = "mc",
  questionKey,
  header,
  progress = null,
  badge,
  prompt,
  promptTag: PromptTag = "h2",
  image,
  animateImage = false,
  animatePrompt = true,
  notice = null,
  timer = null,
  timerStrip = null,
  stageInfo = null,
  answers,
  overlay = null,
  className = "",
}) {
  const tfClass = questionType === "tf" ? "question-screen--tf" : "";
  const isPlayer = variant === "player";
  const rootClass =
    variant === "host"
      ? `question-screen question-screen--host host-phase-fill host-phase-fill--fit alkheelank-screen-host ${tfClass}`
      : `question-screen question-screen--player question-screen--kahoot player-phase-fill player-question-fill alkheelank-safe-x mx-auto w-full ${tfClass}`;

  const ImageEl = animateImage && !isPlayer ? motion.img : "img";
  const imageProps =
    animateImage && !isPlayer
      ? {
          initial: { opacity: 0, scale: 0.94, y: 8 },
          animate: { opacity: 1, scale: 1, y: 0 },
          transition: { ...spring.soft, delay: 0.08 },
        }
      : {};

  const PromptMotion = PromptTag === "h1" ? motion.h1 : motion.h2;
  const PromptEl = animatePrompt && !isPlayer ? PromptMotion : PromptTag;
  const promptProps =
    animatePrompt && !isPlayer
      ? {
          key: questionKey ?? prompt,
          ...fadeUp,
          transition: spring.soft,
        }
      : {};

  return (
    <div className={`${rootClass} ${className}`.trim()} data-question-key={questionKey}>
      {timerStrip}
      <div className="question-screen__body">
        {header ? <div className="question-screen__header">{header}</div> : null}
        {progress}
        {badge ? <div className="question-screen__badge">{badge}</div> : null}
        <PromptEl className="question-screen__prompt" {...promptProps}>
          {prompt}
        </PromptEl>
        <div className="question-screen__stage" data-media-state={image ? "image" : "empty"}>
          {timer ? (
            <div className="question-screen__stage-side question-screen__timer">{timer}</div>
          ) : null}
          {image ? (
            <div className="question-screen__media">
              <div className="question-screen__media-frame">
                <ImageEl {...imageProps} src={image} alt="" className="question-screen__img" />
              </div>
            </div>
          ) : (
            <div className="question-screen__media question-screen__media--empty" aria-hidden>
              <div className="question-screen__empty-stage">
                <span className="question-screen__empty-glyph">?</span>
              </div>
            </div>
          )}
          {stageInfo ? (
            <div className="question-screen__stage-side question-screen__stage-info">{stageInfo}</div>
          ) : null}
        </div>
        {notice}
      </div>
      <div className="question-screen__dock">
        <div className="question-screen__answers">{answers}</div>
      </div>
      {overlay}
    </div>
  );
}
