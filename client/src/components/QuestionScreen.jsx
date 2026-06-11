import { motion } from "framer-motion";
import { fadeUp, spring } from "../lib/motion.js";

/**
 * Kahoot-style question layout:
 *   top   — countdown strip, meta row, then the question in a prominent bar
 *   stage — timer circle (host desktop) · large photo (center) · info bubble
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
  const rootClass =
    variant === "host"
      ? `question-screen question-screen--host host-phase-fill host-phase-fill--fit alkheelank-screen-host ${tfClass}`
      : `question-screen question-screen--player player-phase-fill player-question-fill alkheelank-safe-x mx-auto w-full ${tfClass}`;

  const ImageEl = animateImage ? motion.img : "img";
  const imageProps = animateImage
    ? {
        initial: { opacity: 0, scale: 0.94, y: 8 },
        animate: { opacity: 1, scale: 1, y: 0 },
        transition: { ...spring.soft, delay: 0.08 },
      }
    : {};

  const PromptMotion = PromptTag === "h1" ? motion.h1 : motion.h2;
  const promptProps = animatePrompt
    ? {
        key: questionKey ?? prompt,
        ...fadeUp,
        transition: spring.soft,
      }
    : {};

  const shellProps =
    questionKey != null
      ? {
          key: questionKey,
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          transition: { duration: 0.22 },
        }
      : {};

  const RootEl = questionKey != null ? motion.div : "div";

  return (
    <RootEl className={`${rootClass} ${className}`.trim()} {...shellProps}>
      <div className="question-screen__ambient" aria-hidden />
      {timerStrip}
      <div className="question-screen__body">
        {header}
        {progress}
        {badge}
        {animatePrompt ? (
          <PromptMotion className="question-screen__prompt" {...promptProps}>
            {prompt}
          </PromptMotion>
        ) : (
          <PromptTag className="question-screen__prompt">{prompt}</PromptTag>
        )}
        <div className="question-screen__stage">
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
    </RootEl>
  );
}
