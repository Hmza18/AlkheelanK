import { useState } from "react";
import Logo from "./Logo.jsx";
import Avatar, { ACCESSORIES, CHARACTER_VIBES, PICKER_BASES } from "./characters.jsx";
import { copy } from "../lib/copy.js";

function SegmentedTabs({ tab, onTab }) {
  return (
    <div
      className="mx-auto flex w-full max-w-sm rounded-full bg-ink-800/70 p-1 ring-1 ring-white/10"
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
                ? "bg-ink-700 text-paper ring-1 ring-brand-mid/60"
                : "text-muted hover:text-paper/80"
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
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      aria-label={label}
      className={`flex aspect-square w-full items-center justify-center rounded-2xl p-2 transition ${
        selected
          ? "bg-brand-mid/30 ring-2 ring-brand-mid"
          : "bg-ink-800/70 ring-1 ring-white/10 hover:ring-white/20"
      }`}
    >
      {children}
    </button>
  );
}

function AvatarGrid({ tab, avatar, setBase, setAccessory }) {
  return (
    <div
      className="mx-auto grid w-full max-w-[21rem] grid-cols-3 gap-2.5 sm:max-w-[24rem] sm:gap-3"
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
              label={id === "none" ? "No accessory" : `Accessory ${id}`}
            >
              <Avatar config={{ base: "sun", accessory: id }} size={72} variant="mannequin" />
            </GridTile>
          ))}
    </div>
  );
}

function TeamPicker({ teams, teamId, setTeamId }) {
  return (
    <div className="w-full rounded-2xl bg-ink-800/70 p-3 ring-1 ring-white/10">
      <p className="alkheelank-label mb-2 text-center">Choose team</p>
      <div className="grid grid-cols-2 gap-2">
        {teams.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTeamId(t.id)}
            className={`min-h-touch rounded-xl px-3 py-3 text-sm font-bold ring-1 ${
              teamId === t.id ? "ring-paper text-paper" : "ring-white/10 text-muted"
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
}) {
  const [tab, setTab] = useState("character");

  const setBase = (base) => setAvatar((a) => ({ ...a, base }));
  const setAccessory = (accessory) => setAvatar((a) => ({ ...a, accessory }));

  return (
    <form
      onSubmit={onDone}
      className="alkheelank-screen-player alkheelank-screen-fill flex flex-col items-center lg:justify-center"
    >
      <div className="flex w-full max-w-md flex-col items-center">
        <div className="mt-6 flex shrink-0 justify-center lg:mt-0">
          <Logo size="md" />
        </div>

        <div className="alkheelank-card mt-8 flex w-full flex-col items-center gap-5 p-6 lg:mt-10">
          <div className="flex w-full flex-col items-center bg-gradient-to-br from-brand-start/20 via-brand-mid/15 to-brand-end/10 rounded-2xl px-6 py-5 ring-1 ring-brand-mid/25">
            <p className="alkheelank-label mb-3 text-center">Your look</p>
            <Avatar config={avatar} size={120} variant="picker" />
          </div>

          <input
            className="alkheelank-input w-full"
            placeholder="Nickname"
            maxLength={16}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            autoFocus
          />

          {mode === "teams" && teams.length > 0 && (
            <TeamPicker teams={teams} teamId={teamId} setTeamId={setTeamId} />
          )}

          <SegmentedTabs tab={tab} onTab={setTab} />

          <div className="w-full max-h-[min(46vh,26rem)] overflow-y-auto overscroll-contain px-0.5">
            <AvatarGrid tab={tab} avatar={avatar} setBase={setBase} setAccessory={setAccessory} />
          </div>

          {error && (
            <p className="w-full rounded-xl bg-tile-triangle/20 px-4 py-2 text-center font-semibold text-tile-triangle">
              {error}
            </p>
          )}

          <button type="submit" disabled={joining} className="alkheelank-btn-primary w-full text-xl">
            {joining ? copy.player.joining : copy.player.profileCta}
          </button>
        </div>
      </div>
    </form>
  );
}
