const curatedCharacters = [
  {
    character_id: 40,
    character_name: "Luffy",
    series: "One Piece",
    image_count: 12,
    images: [
      "https://cdn.myanimelist.net/images/characters/9/310307.jpg",
      "https://cdn.myanimelist.net/images/characters/9/55741.jpg",
      "https://cdn.myanimelist.net/images/characters/2/62981.jpg",
      "https://cdn.myanimelist.net/images/characters/7/71304.jpg",
      "https://cdn.myanimelist.net/images/characters/16/100532.jpg",
      "https://cdn.myanimelist.net/images/characters/2/257253.jpg",
      "https://cdn.myanimelist.net/images/characters/3/274105.jpg",
      "https://cdn.myanimelist.net/images/characters/5/315343.jpg",
      "https://cdn.myanimelist.net/images/characters/7/350423.jpg",
      "https://cdn.myanimelist.net/images/characters/3/351271.jpg",
      "https://cdn.myanimelist.net/images/characters/8/434007.jpg",
      "https://cdn.myanimelist.net/images/characters/3/470235.jpg"
    ]
  },
  {
    character_id: 62,
    character_name: "Zoro",
    series: "One Piece",
    image_count: 10,
    images: [
      "https://cdn.myanimelist.net/images/characters/3/100534.jpg",
      "https://cdn.myanimelist.net/images/characters/16/94247.jpg",
      "https://cdn.myanimelist.net/images/characters/5/94250.jpg",
      "https://cdn.myanimelist.net/images/characters/2/146185.jpg",
      "https://cdn.myanimelist.net/images/characters/8/241543.jpg",
      "https://cdn.myanimelist.net/images/characters/12/259387.jpg",
      "https://cdn.myanimelist.net/images/characters/10/267179.jpg",
      "https://cdn.myanimelist.net/images/characters/5/275655.jpg",
      "https://cdn.myanimelist.net/images/characters/8/343380.jpg",
      "https://cdn.myanimelist.net/images/characters/5/343382.jpg"
    ]
  },
  {
    character_id: 20,
    character_name: "Goku",
    series: "Dragon Ball Z",
    image_count: 6,
    images: [
      "https://cdn.myanimelist.net/images/characters/13/48471.jpg",
      "https://cdn.myanimelist.net/images/characters/2/81734.jpg",
      "https://cdn.myanimelist.net/images/characters/15/81797.jpg",
      "https://cdn.myanimelist.net/images/characters/2/81806.jpg",
      "https://cdn.myanimelist.net/images/characters/8/98709.jpg",
      "https://cdn.myanimelist.net/images/characters/12/98711.jpg"
    ]
  },
  {
    character_id: 19,
    character_name: "Vegeta",
    series: "Dragon Ball Z",
    image_count: 6,
    images: [
      "https://cdn.myanimelist.net/images/characters/3/48467.jpg",
      "https://cdn.myanimelist.net/images/characters/8/81726.jpg",
      "https://cdn.myanimelist.net/images/characters/12/81799.jpg",
      "https://cdn.myanimelist.net/images/characters/8/81800.jpg",
      "https://cdn.myanimelist.net/images/characters/10/81801.jpg",
      "https://cdn.myanimelist.net/images/characters/4/81811.jpg"
    ]
  },
  {
    character_id: 17,
    character_name: "Naruto Uzumaki",
    series: "Naruto",
    image_count: 12,
    images: [
      "https://cdn.myanimelist.net/images/characters/2/284121.jpg",
      "https://cdn.myanimelist.net/images/characters/2/12083.jpg",
      "https://cdn.myanimelist.net/images/characters/7/284119.jpg",
      "https://cdn.myanimelist.net/images/characters/6/284118.jpg",
      "https://cdn.myanimelist.net/images/characters/16/306154.jpg",
      "https://cdn.myanimelist.net/images/characters/13/306155.jpg",
      "https://cdn.myanimelist.net/images/characters/9/306156.jpg",
      "https://cdn.myanimelist.net/images/characters/8/306157.jpg",
      "https://cdn.myanimelist.net/images/characters/6/306158.jpg",
      "https://cdn.myanimelist.net/images/characters/4/306159.jpg",
      "https://cdn.myanimelist.net/images/characters/2/306160.jpg",
      "https://cdn.myanimelist.net/images/characters/12/306161.jpg"
    ]
  },
  {
    character_id: 13,
    character_name: "Sasuke Uchiha",
    series: "Naruto",
    image_count: 10,
    images: [
      "https://cdn.myanimelist.net/images/characters/9/131317.jpg",
      "https://cdn.myanimelist.net/images/characters/2/12084.jpg",
      "https://cdn.myanimelist.net/images/characters/8/284116.jpg",
      "https://cdn.myanimelist.net/images/characters/10/306150.jpg",
      "https://cdn.myanimelist.net/images/characters/14/306151.jpg",
      "https://cdn.myanimelist.net/images/characters/12/306152.jpg",
      "https://cdn.myanimelist.net/images/characters/10/306153.jpg",
      "https://cdn.myanimelist.net/images/characters/3/330893.jpg",
      "https://cdn.myanimelist.net/images/characters/5/330894.jpg",
      "https://cdn.myanimelist.net/images/characters/7/330895.jpg"
    ]
  },
  {
    character_id: 145,
    character_name: "Ichigo Kurosaki",
    series: "Bleach",
    image_count: 8,
    images: [
      "https://cdn.myanimelist.net/images/characters/3/22785.jpg",
      "https://cdn.myanimelist.net/images/characters/16/22786.jpg",
      "https://cdn.myanimelist.net/images/characters/2/63861.jpg",
      "https://cdn.myanimelist.net/images/characters/14/134067.jpg",
      "https://cdn.myanimelist.net/images/characters/16/134068.jpg",
      "https://cdn.myanimelist.net/images/characters/12/134069.jpg",
      "https://cdn.myanimelist.net/images/characters/10/134070.jpg",
      "https://cdn.myanimelist.net/images/characters/8/134071.jpg"
    ]
  },
  {
    character_id: 50057,
    character_name: "Nezuko Kamado",
    series: "Demon Slayer",
    image_count: 8,
    images: [
      "https://cdn.myanimelist.net/images/characters/3/378252.jpg",
      "https://cdn.myanimelist.net/images/characters/5/378253.jpg",
      "https://cdn.myanimelist.net/images/characters/7/378254.jpg",
      "https://cdn.myanimelist.net/images/characters/9/378255.jpg",
      "https://cdn.myanimelist.net/images/characters/11/378256.jpg",
      "https://cdn.myanimelist.net/images/characters/13/378257.jpg",
      "https://cdn.myanimelist.net/images/characters/15/378258.jpg",
      "https://cdn.myanimelist.net/images/characters/2/388929.jpg"
    ]
  },
  {
    character_id: 146157,
    character_name: "Tanjiro Kamado",
    series: "Demon Slayer",
    image_count: 8,
    images: [
      "https://cdn.myanimelist.net/images/characters/2/378254.jpg",
      "https://cdn.myanimelist.net/images/characters/2/316826.jpg",
      "https://cdn.myanimelist.net/images/characters/11/365839.jpg",
      "https://cdn.myanimelist.net/images/characters/13/365840.jpg",
      "https://cdn.myanimelist.net/images/characters/15/365841.jpg",
      "https://cdn.myanimelist.net/images/characters/2/365842.jpg",
      "https://cdn.myanimelist.net/images/characters/4/365843.jpg",
      "https://cdn.myanimelist.net/images/characters/6/365844.jpg"
    ]
  },
  {
    character_id: 116,
    character_name: "Edward Elric",
    series: "Fullmetal Alchemist",
    image_count: 6,
    images: [
      "https://cdn.myanimelist.net/images/characters/5/54265.jpg",
      "https://cdn.myanimelist.net/images/characters/9/54266.jpg",
      "https://cdn.myanimelist.net/images/characters/11/54267.jpg",
      "https://cdn.myanimelist.net/images/characters/13/54268.jpg",
      "https://cdn.myanimelist.net/images/characters/15/54269.jpg",
      "https://cdn.myanimelist.net/images/characters/2/60747.jpg"
    ]
  },
  {
    character_id: 422,
    character_name: "Saber",
    series: "Fate/stay night",
    image_count: 10,
    images: [
      "https://cdn.myanimelist.net/images/characters/13/75872.jpg",
      "https://cdn.myanimelist.net/images/characters/15/75873.jpg",
      "https://cdn.myanimelist.net/images/characters/2/75874.jpg",
      "https://cdn.myanimelist.net/images/characters/4/75875.jpg",
      "https://cdn.myanimelist.net/images/characters/6/75876.jpg",
      "https://cdn.myanimelist.net/images/characters/8/75877.jpg",
      "https://cdn.myanimelist.net/images/characters/10/75878.jpg",
      "https://cdn.myanimelist.net/images/characters/12/75879.jpg",
      "https://cdn.myanimelist.net/images/characters/14/75880.jpg",
      "https://cdn.myanimelist.net/images/characters/16/75881.jpg"
    ]
  },
  {
    character_id: 417,
    character_name: "Rem",
    series: "Re:Zero",
    image_count: 8,
    images: [
      "https://cdn.myanimelist.net/images/characters/2/310825.jpg",
      "https://cdn.myanimelist.net/images/characters/4/310826.jpg",
      "https://cdn.myanimelist.net/images/characters/6/310827.jpg",
      "https://cdn.myanimelist.net/images/characters/8/310828.jpg",
      "https://cdn.myanimelist.net/images/characters/10/310829.jpg",
      "https://cdn.myanimelist.net/images/characters/12/310830.jpg",
      "https://cdn.myanimelist.net/images/characters/14/310831.jpg",
      "https://cdn.myanimelist.net/images/characters/16/310832.jpg"
    ]
  }
];

module.exports = curatedCharacters;