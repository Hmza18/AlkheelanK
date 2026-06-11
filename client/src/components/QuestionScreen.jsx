import { useLayoutEffect, useRef } from "react";
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

  const rootRef = useRef(null);

  useLayoutEffect(() => {
    if (variant !== "host") return;
    const root = rootRef.current;
    if (!root) return;

    const rect = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top) };
    };

    const pick = (el, keys) => {
      if (!el) return null;
      const s = getComputedStyle(el);
      return Object.fromEntries(keys.map((k) => [k, s[k]]));
    };

    const promptEl = root.querySelector(".question-screen__prompt");
    const stageEl = root.querySelector(".question-screen__stage");
    const mediaEl = root.querySelector(".question-screen__media");
    const imgEl = root.querySelector(".question-screen__img");
    const dockEl = root.querySelector(".question-screen__dock");
    const answersEl = root.querySelector(".question-screen__answers");
    const bodyEl = root.querySelector(".question-screen__body");
    const stageSideEls = root.querySelectorAll(".question-screen__stage-side");

    const landscapePhone = window.matchMedia("(orientation: landscape) and (max-height: 36rem)").matches;
    const portraitNarrow = window.matchMedia("(max-width: 560px) and (orientation: portrait)").matches;
    const imgRect = rect(imgEl);
    const imgNatural =
      imgEl && imgEl.naturalWidth
        ? { nw: imgEl.naturalWidth, nh: imgEl.naturalHeight }
        : null;

    // #region agent log
    fetch("http://127.0.0.1:7615/ingest/ee6cc38e-44c8-40f4-955a-c71820b327e7", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "57ad63" },
      body: JSON.stringify({
        sessionId: "57ad63",
        runId: "post-fix",
        hypothesisId: "A-B-D",
        location: "QuestionScreen.jsx:useLayoutEffect",
        message: "host question layout zones",
        data: {
          innerW: window.innerWidth,
          innerH: window.innerHeight,
          vvH: window.visualViewport?.height ?? null,
          vvW: window.visualViewport?.width ?? null,
          landscapePhone,
          portraitNarrow,
          prompt: {
            rect: rect(promptEl),
            fontSize: pick(promptEl, ["fontSize", "lineHeight", "paddingTop", "paddingBottom"]),
          },
          stage: { rect: rect(stageEl), minHeight: pick(stageEl, ["minHeight"])?.minHeight },
          media: { rect: rect(mediaEl), overflow: pick(mediaEl, ["overflow"])?.overflow },
          img: {
            rect: imgRect,
            natural: imgNatural,
            maxHeight: pick(imgEl, ["maxHeight", "objectFit"]),
          },
          dock: {
            rect: rect(dockEl),
            height: pick(dockEl, ["height", "maxHeight"]),
            qsDockH: getComputedStyle(root).getPropertyValue("--qs-dock-h").trim(),
          },
          answers: {
            rect: rect(answersEl),
            maxHeight: pick(answersEl, ["maxHeight", "height"]),
          },
          body: { rect: rect(bodyEl) },
          root: { rect: rect(root) },
          stageSideCount: stageSideEls.length,
          stageSideRects: [...stageSideEls].map((el) => rect(el)),
          toolbar: rect(document.querySelector(".host-chrome-toolbar")),
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    if (imgRect && imgNatural?.nw && imgNatural?.nh) {
      const displayedAspect = imgRect.w / imgRect.h;
      const naturalAspect = imgNatural.nw / imgNatural.nh;
      // #region agent log
      fetch("http://127.0.0.1:7615/ingest/ee6cc38e-44c8-40f4-955a-c71820b327e7", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "57ad63" },
        body: JSON.stringify({
          sessionId: "57ad63",
          runId: "post-fix",
          hypothesisId: "C",
          location: "QuestionScreen.jsx:useLayoutEffect",
          message: "image aspect distortion",
          data: {
            displayedAspect: Number(displayedAspect.toFixed(3)),
            naturalAspect: Number(naturalAspect.toFixed(3)),
            aspectDelta: Number(Math.abs(displayedAspect - naturalAspect).toFixed(3)),
            squashed: Math.abs(displayedAspect - naturalAspect) > 0.12,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
    }
  }, [variant, questionKey, prompt, image]);

  return (
    <div ref={rootRef} className={`${rootClass} ${className}`.trim()} data-question-key={questionKey}>
      {timerStrip}
      <div className="question-screen__body">
        {header ? <div className="question-screen__header">{header}</div> : null}
        {progress}
        {badge ? <div className="question-screen__badge">{badge}</div> : null}
        <PromptEl className="question-screen__prompt" {...promptProps}>
          {prompt}
        </PromptEl>
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
    </div>
  );
}
