import { CASES, CASE_RESULTS, type CaseData, type CaseId, type CaseResult } from '../data/cases';

export const caseLabelsEn: Record<CaseId, string> = {
  Veneno: 'Last Sip', Faca: 'Dark Blade', Martelo: 'Fatal Impact', Corda: 'Deadly Knot',
};

const statements: Record<CaseId, { role: string; statement: string; meta?: string }[]> = {
  Veneno: [
    { role: 'Bartender', statement: `**Age:** 34 years\n\n> "I made the drink, using the same ingredients as always. Then I went to serve other customers. I remember Gustavo stopped by the counter, and Juliana was also nearby while I was busy."` },
    { role: 'Waitress', statement: `**Age:** 27 years\n\n> "I brought Fernando some snacks. When I came back to collect the plates, he had gone to the restroom, and his glass was still on the counter. Fernando seemed very uncomfortable with Gustavo's presence. Juliana was closing out the register, but for a few moments, I didn't see her there."` },
    { role: 'Customer', statement: `**Age:** 40 years\n\n> "I've known Fernando for a few years, and he always talks about the conflicts at his old company, especially with his former business partner, Gustavo. We talked for about ten minutes, and then I went to play pool with my friends. Gustavo came to talk to me and said he needed to settle an old matter with Fernando, but he didn't explain what it was about."` },
    { role: 'Bar manager', statement: `**Age:** 38 years\n\n> "I spent most of the evening closing out the register. At one point, I had to step away to get some receipts. When I came back, I saw Gustavo near the counter, but I thought he was waiting for someone."` },
    { role: "Victim's former business partner", statement: `**Age:** 45 years\n\n> "I ran into Fernando by chance. We had some work problems in the past, but that's behind us. We talked briefly, and then I went to another table. I don't remember going past the counter again that evening."` },
  ],
  Faca: [
    { role: 'Head chef', meta: '11 years at the restaurant', statement: `**Age:** 39 years  \n**Time at the restaurant:** 11 years\n\n> "Lucas had been making mistakes at work, and today we argued over a stockroom order. Afterward, I kept preparing the dishes and organizing a few things in the kitchen. When I finished my tasks, I was on my way out until I heard Bruno shouting. I was one of the first to reach the scene and was surprised to find Lucas like that."` },
    { role: 'Sous-chef', statement: `**Age:** 31 years\n\n> "I was organizing the food in the walk-in refrigerator because we need space. We have a lot of vegetables, especially tomatoes, since we make a lot of red sauces. I heard Lucas arguing with Rafael and couldn't make out what they were saying; all I understood was that the chef was going to fire him. But when I came out of the refrigerator, I only saw Rafael washing his hands. Also, the knife I had left on the counter was missing."` },
    { role: 'Waiter', statement: `**Age:** 26 years\n\n> "I went into the kitchen a few times to pick up orders. I saw Lucas heading toward the stockroom, upset. Later, I borrowed Mariana's knife to give to a customer who had dropped his. In the hallway, I met Rafael and handed him the knife, since he would be going back to the kitchen afterward."` },
    { role: 'Cashier', statement: `**Age:** 29 years\n\n> "I was at the register settling customers' bills. I remember the cameras had malfunctioned on another occasion, when our restaurant was robbed. I only saw Diego helping a customer to improve our restaurant's reputation and then handing something to Rafael. When I looked to the side, Rafael walked past me toward the stockroom to get the tomatoes that had run out, according to him."` },
    { role: 'Cleaner', statement: `**Age:** 42 years\n\n> "I was washing the kitchen floor around closing time. I heard Rafael tell Mariana that he would settle some problem with Lucas that evening. Later, I found Lucas's body with the knife stuck in him when I went to clean the back of the restaurant."` },
  ],
  Martelo: [
    { role: 'Engineer', statement: `**Age:** 52 years\n\n> "Eduardo complained a lot about the renovation delays and put pressure on everyone. At the time of the crime, I was checking a cement delivery in front of the house. I only went inside when I heard people shouting. Laura was the last to come down the stairs during the commotion."` },
    { role: 'Bricklayer', statement: `**Age:** 38 years\n\n> "I spent the afternoon working outside. I used a hammer to adjust some wooden forms and then left the tool near the entrance. I saw a few people moving around the house, but I was too busy to pay attention. I only realized something had happened when people started shouting."` },
    { role: 'Electrician', statement: `**Age:** 40 years\n\n> "I was installing the outlets on the second floor when I saw Laura get home from school. She went upstairs to her room, but some time later, I heard footsteps coming down the stairs. I couldn't see who it was. I also heard an argument downstairs, but I thought it was a private family matter."` },
    { role: 'Architect', statement: `**Age:** 35 years\n\n> "I went to check some measurements in the kitchen. Eduardo seemed worried and mentioned that he needed to resolve a family problem. Later, I heard raised voices coming from the direction of the office. I couldn't make out the conversation, but one of the voices sounded like a woman's. I preferred not to get involved."` },
    { role: "Victim's daughter", statement: `**Age:** 18 years\n\n> "I got home from school and went straight to my room. I was upset about some things I had recently discovered and didn't want to talk to anyone. I put on my headphones and tried to distract myself. I only came downstairs when I heard people moving around. I don't know what happened in the office."` },
  ],
  Corda: [
    { role: "Victim's wife", statement: `**Age:** 48 years\n\n> "Rogério had been very stressed about the company. Lately, he drank almost every night to be able to sleep. That evening, I noticed he was especially worried after talking to Marcos. I went upstairs to watch television, and when I came down to look for him, I found that horrible scene. I can't believe what happened."` },
    { role: 'Business partner and friend', statement: `**Age:** 50 years\n\n> "I was invited to dinner and took the opportunity to talk to Rogério about some partnership documents. He was very nervous and even drank while we discussed the company's problems. Then I went to the office to organize some papers. I only found out what had happened when I heard Helena shouting. Rogério was under a lot of pressure, but I never imagined it would come to this."` },
    { role: 'Housekeeper', statement: `**Age:** 41 years\n\n> "I finished tidying the kitchen after dinner. I remember Marcos asked where some things in the laundry room were, but I didn't find it strange because he had been visiting the house for years. Later, I heard the sound of something being dragged, but I thought it was Sebastião working. When the lady of the house shouted, I ran out to help."` },
    { role: 'Caretaker', statement: `**Age:** 58 years\n\n> "I spent most of the evening at the back of the house, looking after the tools and the electronic gate. I saw Marcos arrive around seven. I used to help Rogério with the ropes in the nautical decorations, but he and Marcos also knew quite a lot about it. That evening, I noticed the laundry room ladder wasn't in its usual place. I thought someone had used it for a repair."` },
  ],
};

export const casesEn = Object.fromEntries(Object.entries(CASES).map(([id, data]) => [id, {
  suspects: data.suspects.map((suspect, index) => ({ ...suspect, ...statements[id as CaseId][index] })),
}])) as Record<CaseId, CaseData>;

const explanations: Record<CaseId, string> = {
  Veneno: `**Gustavo Almeida**, Fernando's former business partner, tampered with the drink while the victim went to the restroom and left his glass unattended.\n\nFernando was about to sue him for embezzlement. The bottle was clean, and only the victim's glass contained the toxic substance, showing that the poison was added directly to the drink during the cameras' blind spot.`,
  Faca: `The culprit is **Rafael Oliveira**, the head chef.\n\nLucas had discovered that Rafael was embezzling money from the restaurant for his own benefit and threatened to report him. Taking advantage of the cameras' malfunction, the chef secretly took a knife from the restaurant and called Lucas to talk in the stockroom. Lucas thought he was going to be fired, but his true fate was death.`,
  Martelo: `The person responsible is **Laura Almeida**, the victim's daughter.\n\nAfter discovering her father's infidelity and the abuse her mother had suffered, Laura confronted him in the office and struck him with the hammer during the argument. The message on the phone, the broken bracelet and the blood on Laura's T-shirt link her directly to the crime scene.`,
  Corda: `The culprit is **Marcos Vinícius**, the victim's business partner and longtime friend.\n\nRogério had discovered that Marcos had embezzled millions. Marcos sedated the victim, used the laundry room ladder and tied the rope with sailor's knots to stage a suicide. The horizontal mark on the neck, the sedative in the body and his nautical knowledge exposed the staging.`,
};

export const caseResultsEn = Object.fromEntries(Object.entries(CASE_RESULTS).map(([id, result]) => [id, {
  ...result, explanation: explanations[id as CaseId],
}])) as Record<CaseId, CaseResult>;

export const hotspotDetailsEn = [
  { title: 'Nitrogenous Base', text: 'Nitrogenous bases are chemical structures that store genetic information. They sit inside DNA, connecting the two strands of the molecule like the rungs of a ladder. There are four bases: adenine, thymine, cytosine and guanine. Adenine always pairs with thymine, while cytosine pairs with guanine.' },
  { title: 'Adenine', text: 'Adenine is a nitrogenous base that pairs with thymine in DNA.' },
  { title: 'Thymine', text: 'Thymine is a nitrogenous base that pairs with adenine in DNA.' },
  { title: 'Cytosine', text: 'Cytosine is a nitrogenous base that pairs with guanine in DNA.' },
  { title: 'Guanine', text: 'Guanine is a nitrogenous base that pairs with cytosine in DNA.' },
  { title: 'Sugar-phosphate backbone', text: 'The blue part represents the outer structure of DNA, made up of alternating sugar molecules, called deoxyribose, and phosphate groups. It supports the double helix and keeps the nitrogenous bases organized inside it.' },
];
