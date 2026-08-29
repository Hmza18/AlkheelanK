import assert from "node:assert/strict";
import test from "node:test";

import * as GM from "./gameManager.js";

const oneQuestionQuiz = {
  title: "Regression quiz",
  questions: [
    {
      type: "mc",
      question: "Which option is correct?",
      answers: ["A", "B"],
      correct: 0,
      timeLimit: 10,
    },
  ],
};

test("finished games are cleaned up without a game:ended broadcast", () => {
  const game = GM.createGame("host-socket", oneQuestionQuiz, {});

  assert.equal(GM.shouldBroadcastGameEnded(game), true);
  assert.ok(GM.startNextQuestion(game));
  assert.equal(GM.startNextQuestion(game), null);
  assert.equal(game.status, "ended");
  assert.equal(GM.shouldBroadcastGameEnded(game), false);

  GM.destroyGame(game.pin);
});
