import { CASES, CASE_RESULTS, type CaseData, type CaseId, type CaseResult } from '../data/cases';

export const caseLabelsEn: Record<CaseId, string> = {
  Veneno: 'Last Sip', Faca: 'Dark Blade', Martelo: 'Fatal Impact', Corda: 'Deadly Knot',
};

const statements: Record<CaseId, { role: string; statement: string; meta?: string }[]> = {
  Veneno: [
    { role: 'Bartender', statement: `**Age:** 34 years\n\n> "I made the drink, but I used the same ingredients as always. Then I started serving other customers. I wasn't watching his glass the whole time."` },
    { role: 'Waitress', statement: `**Age:** 27 years\n\n> "I brought Fernando some snacks. When I came back to collect the plates, he had already gone to the restroom, and his glass was on the counter."` },
    { role: 'Customer', statement: `**Age:** 40 years\n\n> "I've known Fernando for a few years. We talked for about ten minutes, and then I went to play pool with my friends."` },
    { role: 'Bar manager', statement: `**Age:** 38 years\n\n> "I spent most of the evening closing out the register. I only went to the counter when I heard customers shouting for help."` },
    { role: "Victim's former business partner", statement: `**Age:** 45 years\n\n> "I ran into Fernando by chance. We had some problems in the past, but that's behind us. We talked briefly, and then I went to another table."` },
  ],
  Faca: [
    { role: 'Head chef', meta: '11 years at the restaurant', statement: `**Age:** 39 years  \n**Time at the restaurant:** 11 years\n\n> "Lucas had been making mistakes at work, and today we argued because he forgot a stockroom order. Afterward, I went back to preparing the dishes and was one of the first to arrive when I heard the screams."` },
    { role: 'Sous-chef', statement: `**Age:** 31 years\n\n> "I was organizing the food in the walk-in refrigerator. I heard the chef arguing with Lucas, but that sometimes happens in busy kitchens.\n>\n> When I came out of the refrigerator, I didn't see Lucas anymore."` },
    { role: 'Waiter', statement: `**Age:** 26 years\n\n> "I went into the kitchen a few times to pick up orders for the last tables.\n>\n> I saw Lucas heading toward the stockroom carrying an empty box.\n>\n> I didn't see him again after that."` },
    { role: 'Cashier', statement: `**Age:** 29 years\n\n> "I stayed at the register settling customers' bills.\n>\n> I don't usually go into the kitchen. I only heard an argument earlier, but I couldn't make out what it was about."` },
    { role: 'Cleaner', statement: `**Age:** 42 years\n\n> "I was washing the kitchen floor around closing time, which is why the floor was wet. When I found Lucas lying on the floor, I ran to get help."` },
  ],
  Martelo: [
    { role: 'Engineer', statement: `**Age:** 52 years\n\n> "Eduardo complained a lot about the renovation delays and put pressure on everyone. At the time of the crime, I was checking a cement delivery in front of the house. I only went inside when I heard people shouting."` },
    { role: 'Bricklayer', statement: `**Age:** 38 years\n\n> "I spent the afternoon working outside. I picked up a hammer earlier to secure some wooden forms, but I put it back afterward. I didn't even go into the office."` },
    { role: 'Electrician', statement: `**Age:** 40 years\n\n> "I was finishing the installation of the outlets on the second floor. I saw Laura go upstairs to her room when she got home from school. I didn't see anyone else after that."` },
    { role: 'Architect', statement: `**Age:** 35 years\n\n> "I went to check some measurements in the kitchen. Eduardo seemed worried and said he needed to deal with a family matter that afternoon."` },
    { role: "Victim's daughter", statement: `**Age:** 18 years\n\n> "I got home from school and went up to my room. I needed to talk to my dad, but I changed my mind. I put on headphones and stayed upstairs. I only came down when I heard people running."` },
  ],
  Corda: [
    { role: "Victim's wife", statement: `**Age:** 48 years\n\n> "Rogério had been very stressed about the company lately. He drank every night to try to sleep. I was upstairs watching TV when I realized he was taking a long time to come back. When I went downstairs, I saw that horrible scene."` },
    { role: 'Business partner and friend', statement: `**Age:** 50 years\n\n> "I was invited to dinner and afterward was in the office dealing with business documents when I heard Helena screaming. I was shocked. Rogério had never shown any sign that he would take his own life, despite the unbearable pressure."` },
    { role: 'Housekeeper', statement: `**Age:** 41 years\n\n> "My shift was already over, and I was tidying the kitchen before going to the room at the back where I sleep. I only came out when the lady of the house started screaming for help."` },
    { role: 'Caretaker', statement: `**Age:** 58 years\n\n> "I was in the outbuilding looking after the tools and the electronic gate. I saw Marcos arrive around 7 p.m. I sometimes helped my employer with the ropes in the nautical decorations, but I hadn't handled them in a long time."` },
  ],
};

export const casesEn = Object.fromEntries(Object.entries(CASES).map(([id, data]) => [id, {
  suspects: data.suspects.map((suspect, index) => ({ ...suspect, ...statements[id as CaseId][index] })),
}])) as Record<CaseId, CaseData>;

const explanations: Record<CaseId, string> = {
  Veneno: `**Gustavo Almeida**, Fernando's former business partner, tampered with the drink while the victim went to the restroom and left his glass unattended.\n\nFernando was about to sue him for **embezzlement**. The bottle was clean, and only the victim's glass contained the toxic substance, showing that the poison was added directly to the drink during the cameras' blind spot.`,
  Faca: `The culprit is **Rafael Oliveira**, the head chef.\n\nLucas had discovered that Rafael was stealing expensive ingredients from the restaurant to sell on the side and threatened to report him. Taking advantage of the cameras' malfunction, the chef used a knife from the restaurant and tried to hide among the fingerprints of several employees and the ordinary kitchen evidence.`,
  Martelo: `The person responsible is **Laura Almeida**, the victim's daughter.\n\nAfter discovering her father's infidelity and the abuse her mother had suffered, Laura confronted him in the office and struck him with the hammer during the argument. The message on the phone, the broken bracelet and the blood spatter on her sweatshirt linked Laura directly to the scene.`,
  Corda: `The culprit is **Marcos Vinícius**, the victim's business partner and longtime friend.\n\nRogério had discovered that Marcos had embezzled millions. Marcos sedated the victim, used the laundry room ladder and tied the rope with sailor's knots to stage a suicide. The horizontal mark on the neck, the sedative and his nautical knowledge exposed the staging.`,
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
