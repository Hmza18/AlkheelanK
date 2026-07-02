import { motion } from "framer-motion";
import { motionSafe, questionIntro, spring, useReducedMotion } from "../lib/motion.js";

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
  const noImageClass = image ? "" : " question-screen--no-image";
  const hasStageContent = !!(image || timer || stageInfo);
  const reduced = useReducedMotion();
  const delay = (d) => (reduced ? 0 : d);
  const rootClass =
    variant === "host"
      ? `question-screen question-screen--host question-screen--kahoot host-phase-fill host-phase-fill--fit alkheelank-screen-host ${tfClass}${noImageClass}`
      : `question-screen question-screen--player question-screen--kahoot player-phase-fill player-question-fill alkheelank-safe-x mx-auto w-full ${tfClass}${noImageClass}`;

  // Kahoot-order entrance: prompt → image → tiles (in AnswerTile) → timer.
  const ImageEl = animateImage ? motion.img : "img";
  const imageProps = animateImage
    ? {
        key: `img-${questionKey ?? image}`,
        initial: { opacity: 0, scale: 0.94, y: 8 },
        animate: { opacity: 1, scale: 1, y: 0 },
        transition: { ...motionSafe(spring.soft, reduced), delay: delay(questionIntro.image) },
      }
    : {};

  const PromptMotion = PromptTag === "h1" ? motion.h1 : motion.h2;
  const PromptEl = animatePrompt ? PromptMotion : PromptTag;
  const promptProps = animatePrompt
    ? {
        key: questionKey ?? prompt,
        initial: { opacity: 0, y: 18, scale: 0.96 },
        animate: { opacity: 1, y: 0, scale: 1 },
        transition: { ...motionSafe(spring.soft, reduced), delay: delay(questionIntro.prompt) },
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
        {hasStageContent ? (
          <div className="question-screen__stage">
            {timer ? (
              <motion.div
                key={`timer-${questionKey ?? "q"}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ ...motionSafe(spring.soft, reduced), delay: delay(questionIntro.timer) }}
                className="question-screen__stage-side question-screen__timer"
              >
                {timer}
              </motion.div>
            ) : null}
            {image ? (
              <div className="question-screen__media">
                <div className="question-screen__media-frame">
                  <ImageEl {...imageProps} src={image} alt="" className="question-screen__img" />
                </div>
              </div>
            ) : null}
            {stageInfo ? (
              <div className="question-screen__stage-side question-screen__stage-info">{stageInfo}</div>
            ) : null}
          </div>
        ) : null}
        {notice}
      </div>
      <div className="question-screen__dock">
        <div className="question-screen__answers">{answers}</div>
      </div>
      {overlay}
    </div>
  );
}
