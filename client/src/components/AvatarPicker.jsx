import { useState } from "react";
import { motion } from "framer-motion";
import Logo from "./Logo.jsx";
import Avatar, { ACCESSORIES, ACCESSORY_VIBES, CHARACTER_VIBES, PICKER_BASES } from "./characters.jsx";
import { copy } from "../lib/copy.js";
import { sfx } from "../lib/sound.js";

function SegmentedTabs({ tab, onTab }) {
  return (
    <div
      className="mx-auto flex w-full max-w-sm rounded-full bg-surface-muted p-1 ring-1 ring-edge"
      role="tablist"
      aria-label="Avatar options"
    >
      {["character", "accessory"].map((id) => {
        const label = id === "character" ? "Character" : "Accessory";
        const active = tab === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onTab(id)}
            className={`min-h-touch flex-1 rounded-full px-4 py-2.5 text-sm font-bold transition ${
              active
                ? "bg-surface-elevated text-ink-900 ring-1 ring-brand-mid/60"
                : "text-muted hover:text-ink-900"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function GridTile({ selected, onClick, label, children }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.9 }}
      aria-pressed={selected}
      aria-label={label}
      className={`flex aspect-square w-full items-center justify-center rounded-2xl p-2 transition ${
        selected
          ? "bg-brand-mid/30 ring-2 ring-brand-mid"
          : "bg-surface-muted ring-1 ring-edge hover:ring-brand-mid/30"
      }`}
    >
      {/* pop the artwork when it becomes the selection */}
      <motion.span
        className="pointer-events-none"
        animate={selected ? { scale: [1, 1.16, 1] } : { scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {children}
      </motion.span>
    </motion.button>
  );
}

function AvatarGrid({ tab, avatar, setBase, setAccessory }) {
  return (
    <div
      className="mx-auto grid w-full max-w-[21rem] grid-cols-3 gap-2.5 sm:max-w-[26rem] sm:grid-cols-4 sm:gap-3"
      role="tabpanel"
      aria-label={tab === "character" ? "Characters" : "Accessories"}
    >
      {tab === "character"
        ? PICKER_BASES.map((id) => (
            <GridTile
              key={id}
              selected={avatar.base === id}
              onClick={() => setBase(id)}
                  label={`${id} — ${CHARACTER_VIBES[id] || id}`}
            >
              <Avatar config={{ base: id, accessory: "none" }} size={72} variant="picker" />
            </GridTile>
          ))
        : ACCESSORIES.map((id) => (
            <GridTile
              key={id}
              selected={(avatar.accessory || "none") === id}
              onClick={() => setAccessory(id)}
              label={ACCESSORY_VIBES[id] || id}
            >
              <Avatar config={{ base: "sun", accessory: id }} size={72} variant="mannequin" />
            </GridTile>
          ))}
    </div>
  );
}

function TeamPicker({ teams, teamId, setTeamId }) {
  return (
    <div className="w-full rounded-2xl bg-surface-muted p-3 ring-1 ring-edge">
      <p className="alkheelank-label mb-2 text-center">Choose team</p>
      <div className="grid grid-cols-2 gap-2">
        {teams.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTeamId(t.id)}
            className={`min-h-touch rounded-xl px-3 py-3 text-sm font-bold ring-1 ${
              teamId === t.id ? "ring-brand-mid text-ink-900" : "ring-edge text-muted"
            }`}
            style={{ backgroundColor: `${t.color}22` }}
          >
            {t.name}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function AvatarPicker({
  nickname,
  setNickname,
  avatar,
  setAvatar,
  mode,
  teams,
  teamId,
  setTeamId,
  onDone,
  joining,
  error,
  editMode = false,
  onCancel,
}) {
  const [tab, setTab] = useState("character");

  const setBase = (base) => setAvatar((a) => ({ ...a, base }));
  const setAccessory = (accessory) => setAvatar((a) => ({ ...a, accessory }));
  const shuffleLook = () => {
    sfx.tap?.();
    setAvatar((a) => ({
      ...a,
      base: PICKER_BASES[Math.floor(Math.random() * PICKER_BASES.length)],
      accessory: ACCESSORIES[Math.floor(Math.random() * ACCESSORIES.length)],
    }));
  };

  return (
    <form
      onSubmit={onDone}
      className="alkheelank-screen-player alkheelank-screen-fill flex flex-col items-center lg:justify-center landscapePhone:py-2"
    >
      <div className="flex w-full max-w-md flex-col items-center">
        <div className="mt-6 flex shrink-0 justify-center lg:mt-0 landscapePhone:mt-1">
          <Logo size="md" />
        </div>

        <div className="alkheelank-card mt-6 flex w-full flex-col items-center gap-4 p-5 lg:mt-8 landscapePhone:mt-3 landscapePhone:gap-3 landscapePhone:p-4">
          {/* Live preview + name on one compact row — the look updates in place
              as tiles are picked, no header copy needed. */}
          <div className="flex w-full items-center gap-4 rounded-2xl bg-brand-gradient-soft-br px-4 py-3 ring-1 ring-brand-mid/25 landscapePhone:gap-3 landscapePhone:px-3 landscapePhone:py-2">
            <div className="relative shrink-0">
              <motion.span
                key={`${avatar.base}-${avatar.accessory}`}
                initial={{ scale: 0.85 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 420, damping: 18 }}
                className="inline-flex"
              >
                <Avatar config={avatar} size={editMode ? 96 : 84} variant="picker" />
              </motion.span>
              <button
                type="button"
                onClick={shuffleLook}
                aria-label="Surprise me — random look"
                title="Random look"
                className="absolute -bottom-1.5 -right-1.5 grid h-9 w-9 place-items-center rounded-full bg-surface-elevated text-base ring-1 ring-edge shadow-card transition hover:scale-110"
              >
                🎲
              </button>
            </div>
            {!editMode ? (
              <input
                className="alkheelank-input w-full flex-1 !text-left"
                placeholder="Nickname"
                maxLength={16}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                autoFocus
              />
            ) : (
              <p className="flex-1 text-left text-sm text-muted landscapePhone:text-xs">{copy.player.editLookHint}</p>
            )}
          </div>

          {!editMode && mode === "teams" && teams.length > 0 && (
            <TeamPicker teams={teams} teamId={teamId} setTeamId={setTeamId} />
          )}

          <SegmentedTabs tab={tab} onTab={setTab} />

          <div className="w-full max-h-[min(46dvh,26rem)] overflow-y-auto overscroll-contain px-0.5">
            <AvatarGrid tab={tab} avatar={avatar} setBase={setBase} setAccessory={setAccessory} />
          </div>

          {error && (
            <p className="w-full rounded-xl bg-tile-triangle/20 px-4 py-2 text-center font-semibold text-tile-triangle">
              {error}
            </p>
          )}

          <button type="submit" disabled={joining} className="alkheelank-btn-primary w-full text-xl">
            {joining
              ? editMode
                ? copy.player.savingLook
                : copy.player.joining
              : editMode
              ? copy.player.saveLook
              : copy.player.profileCta}
          </button>

          {editMode && onCancel && (
            <button type="button" onClick={onCancel} className="alkheelank-btn-ghost w-full">
              Cancel
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
