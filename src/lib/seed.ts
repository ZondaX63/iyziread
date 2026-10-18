import { db, getSettings, saveBook, updateSettings } from "./db";

const alice = [
  {
    title: "I. Down the Rabbit-Hole",
    text: `Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it, "and what is the use of a book," thought Alice, "without pictures or conversations?"

So she was considering in her own mind (as well as she could, for the hot day made her feel very sleepy and stupid), whether the pleasure of making a daisy-chain would be worth the trouble of getting up and picking the daisies, when suddenly a White Rabbit with pink eyes ran close by her.

There was nothing so very remarkable in that; nor did Alice think it so very much out of the way to hear the Rabbit say to itself, "Oh dear! Oh dear! I shall be late!" But when the Rabbit actually took a watch out of its waistcoat-pocket, and looked at it, and then hurried on, Alice started to her feet.

In another moment down went Alice after it, never once considering how in the world she was to get out again. The rabbit-hole went straight on like a tunnel for some way, and then dipped suddenly down, so suddenly that Alice had not a moment to think about stopping herself before she found herself falling down a very deep well.`,
  },
  {
    title: "II. The Pool of Tears",
    text: `"Curiouser and curiouser!" cried Alice (she was so much surprised, that for the moment she quite forgot how to speak good English); "now I'm opening out like the largest telescope that ever was! Good-bye, feet!"

Just then her head struck against the roof of the hall: in fact she was now more than nine feet high, and she at once took up the little golden key and hurried off to the garden door.

Poor Alice! It was as much as she could do, lying down on one side, to look through into the garden with one eye; but to get through was more hopeless than ever: she sat down and began to cry again.

"You ought to be ashamed of yourself," said Alice, "a great girl like you, to go on crying in this way! Stop this moment, I tell you!" But she went on all the same, shedding gallons of tears, until there was a large pool all round her.`,
  },
  {
    title: "III. A Caucus-Race and a Long Tale",
    text: `They were indeed a queer-looking party that assembled on the bank: the birds with draggled feathers, the animals with their fur clinging close to them, and all dripping wet, cross, and uncomfortable.

The first question of course was, how to get dry again: they had a consultation about this, and after a few minutes it seemed quite natural to Alice to find herself talking familiarly with them, as if she had known them all her life.

"What I was going to say," said the Dodo in an offended tone, "was, that the best thing to get us dry would be a Caucus-race." "What is a Caucus-race?" said Alice. "Why," said the Dodo, "the best way to explain it is to do it."

First it marked out a race-course, in a sort of circle, and then all the party were placed along the course, here and there. There was no "One, two, three, and away," but they began running when they liked, and left off when they liked.`,
  },
];

const pride = [
  {
    title: "Chapter 1",
    text: `It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.

However little known the feelings or views of such a man may be on his first entering a neighbourhood, this truth is so well fixed in the minds of the surrounding families, that he is considered the rightful property of some one or other of their daughters.

"My dear Mr. Bennet," said his lady to him one day, "have you heard that Netherfield Park is let at last?" Mr. Bennet replied that he had not. "But it is," returned she; "for Mrs. Long has just been here, and she told me all about it."

Mr. Bennet made no answer. "Do you not want to know who has taken it?" cried his wife impatiently. "You want to tell me, and I have no objection to hearing it." This was invitation enough.`,
  },
  {
    title: "Chapter 2",
    text: `Mr. Bennet was among the earliest of those who waited on Mr. Bingley. He had always intended to visit him, though to the last always assuring his wife that he should not go; and till the evening after the visit was paid she had no knowledge of it.

Observing his second daughter employed in trimming a hat, he suddenly addressed her with, "I hope Mr. Bingley will like it, Lizzy." "We are not in a way to know what Mr. Bingley likes," said her mother resentfully, "since we are not to visit."

"But you forget, mamma," said Elizabeth, "that we shall meet him at the assemblies, and that Mrs. Long promised to introduce him." The astonishment of the ladies was just what he wished.`,
  },
  {
    title: "Chapter 3",
    text: `Not all that Mrs. Bennet, however, with the assistance of her five daughters, could ask on the subject, was sufficient to draw from her husband any satisfactory description of Mr. Bingley.

Mr. Bingley was good-looking and gentlemanlike; he had a pleasant countenance, and easy, unaffected manners. His friend Mr. Darcy soon drew the attention of the room by his fine, tall person, handsome features, noble mien, and the report which was in general circulation within five minutes after his entrance, of his having ten thousand a year.

"Come, Darcy," said he, "I must have you dance. I hate to see you standing about by yourself in this stupid manner." "She is tolerable, but not handsome enough to tempt me," replied Darcy coolly.`,
  },
];

export async function seedIfNeeded() {
  const s = await getSettings();
  if (s.seeded) return;
  if (!(await db.books.get("alice"))) await saveBook({ id: "alice", title: "Alice's Adventures in Wonderland", author: "Lewis Carroll", source: "seed" }, alice);
  if (!(await db.books.get("pride"))) await saveBook({ id: "pride", title: "Pride and Prejudice", author: "Jane Austen", source: "seed" }, pride);
  await updateSettings({ seeded: true });
}
