// @flow

import _keyBy from 'lodash/fp/keyBy';
import _shuffle from 'lodash/fp/shuffle';

import { assetsCacheURLPrefix } from './asset-meta-data';

type Investors = {
  +id: string,
  +name: string,
  +description: string,
  +involvement?: string,
  +imageURL: string,
  +website?: string,
  +twitter?: string,
  +linkedin?: string,
};

const investorsData: $ReadOnlyArray<Investors> = [
  {
    id: 'ashoat_tevosyan',
    name: 'Ashoat Tevosyan',
    description:
      'Founder of Comm. Learned to code modding PHP forums in the mid-2000s. Joined Facebook full-time at age 20 with last role as EM.',
    involvement: 'Initially Invested in May 2020',
    imageURL: `${assetsCacheURLPrefix}/ashoat.png`,
    website: 'https://site.ashoat.com',
    twitter: 'ashoat',
    linkedin: 'in/ashoatt',
  },
  {
    id: 'slow_ventures',
    name: 'Slow Ventures',
    description:
      'Slow Ventures is a generalist fund that backs founders from the earliest days. Slow has been heavily investing in and around the crypto space for the last 5+ years.',
    involvement: 'Initially Invested in Feb 2021',
    imageURL: `${assetsCacheURLPrefix}/investors/slow_ventures.jpeg`,
    website: 'https://slow.co',
    twitter: 'slow',
    linkedin: 'company/slow-ventures',
  },
  {
    id: 'electric_capital',
    name: 'Electric Capital',
    description:
      'An early stage venture firm focused on cryptocurrencies, blockchain, fintech, and marketplaces.',
    involvement: 'Initially Invested in Feb 2021',
    imageURL: `${assetsCacheURLPrefix}/investors/electric_capital.jpeg`,
    twitter: 'ElectricCapital',
    linkedin: 'company/electric-capital',
  },
  {
    id: 'graph_ventures',
    name: 'Graph Ventures',
    description:
      'Early-stage VC firm established in 2011 by leading technology entrepreneurs and executives with 300+ global investments.',
    involvement: 'Initially Invested in Nov 2021',
    imageURL: `${assetsCacheURLPrefix}/investors/graph_ventures.jpeg`,
    website: 'https://www.graphventures.com',
    twitter: 'graphventures',
    linkedin: 'company/graph-ventures',
  },
  {
    id: 'draft_vc',
    name: 'Draft VC',
    description:
      'Seed stage venture fund focused on Web3, climate, proptech, and fintech.',
    involvement: 'Initially Invested in Dec 2021',
    imageURL: `${assetsCacheURLPrefix}/investors/draft_vc.jpeg`,
    website: 'https://draftvc.com',
    twitter: 'draftvc',
    linkedin: 'company/draft-ventures',
  },
  {
    id: 'd1_ventures',
    name: 'D1 Ventures',
    description:
      'D1 Ventures is a private investment firm backing early stage crypto native infrastructures and applications.',
    involvement: 'Initially Invested in Feb 2022',
    imageURL: `${assetsCacheURLPrefix}/investors/d1_ventures.jpeg`,
    website: 'https://www.d1.ventures',
    twitter: 'd1ventures',
    linkedin: 'company/d1-ventures',
  },
  {
    id: 'eniac_ventures',
    name: 'Eniac Ventures',
    description:
      'Leads pre-seed & seed rounds in bold founders who use code to create transformational companies.',
    involvement: 'Initially Invested in Feb 2022',
    imageURL: `${assetsCacheURLPrefix}/investors/eniac_ventures.jpeg`,
    website: 'https://eniac.vc',
    twitter: 'EniacVC',
    linkedin: 'company/eniacvc',
  },
  {
    id: 'seed_club_ventures',
    name: 'Seed Club Ventures',
    description:
      'Venture DAO that invests in early-stage projects building and enabling a community-owned internet. SCV believes community ownership is the superpower of Web3 and is guided by the principles of inclusivity and opportunity for all participants.',
    involvement: 'Initially Invested in Dec 2021',
    imageURL: `${assetsCacheURLPrefix}/investors/seed_club_ventures.jpeg`,
    twitter: 'seedclubvc',
  },
  {
    id: 'metaweb_ventures',
    name: 'MetaWeb Ventures',
    description: 'Global crypto firm investing in the future of Web3.',
    involvement: 'Initially Invested in Feb 2022',
    imageURL: `${assetsCacheURLPrefix}/investors/metaweb_ventures.jpeg`,
    website: 'https://www.metaweb.vc',
    twitter: 'MetaWebVC',
  },
  {
    id: 'coinfund',
    name: 'CoinFund',
    description:
      'CoinFund is a web3 and crypto focused investment firm and registered investment adviser founded in 2015 with the goal of shaping the global transition to web3. The firm invests in seed, venture and liquid opportunities within the blockchain sector with a focus on digital assets, decentralization technologies, and key enabling infrastructure.',
    involvement: 'Initially Invested in July 2022',
    imageURL: `${assetsCacheURLPrefix}/investors/coinfund.jpeg`,
    website: 'https://www.coinfund.io',
    twitter: 'coinfund_io',
    linkedin: 'company/coinfund',
  },
  {
    id: 'shima_capital',
    name: 'Shima Capital',
    description:
      'An early-stage global venture firm focused on supporting cutting edge blockchain startups.',
    involvement: 'Initially Invested in July 2022',
    imageURL: `${assetsCacheURLPrefix}/investors/shima_capital.jpeg`,
    website: 'https://shima.capital',
    twitter: 'shimacapital',
    linkedin: 'company/shima-capital',
  },
  {
    id: 'republic_capital',
    name: 'Republic Capital',
    description:
      'Republic Capital is a multi-stage venture capital firm focused on accelerating disruptive innovations.',
    involvement: 'Initially Invested in July 2022',
    imageURL: `${assetsCacheURLPrefix}/investors/republic_capital.jpeg`,
    website: 'https://www.republiccapital.co',
    twitter: '_rcapital_',
    linkedin: 'company/republic-capital',
  },
  {
    id: 'global_coin_research',
    name: 'Global Coin Research',
    description: 'Investment & Research DAO focused on Web3',
    involvement: 'Initially Invested in July 2022',
    imageURL: `${assetsCacheURLPrefix}/investors/global_coin_research.jpeg`,
    website: 'https://globalcoinresearch.com',
    twitter: 'Globalcoinrsrch',
  },
  {
    id: '3se_holdings',
    name: '3SE Holdings',
    description: 'Crypto-Native Operators Fund',
    involvement: 'Initially Invested in July 2022',
    imageURL: `${assetsCacheURLPrefix}/investors/3se_holdings.jpeg`,
    website: 'https://3seholdings.com',
    twitter: '3SEHoldings',
  },
  {
    id: 'vibe_capital',
    name: 'Vibe Capital',
    description:
      'Vibecap is a $10m Pre-Seed and Seed stage fund that invests in Deep Sci, AI, and Web3.',
    involvement: 'Initially Invested in July 2022',
    imageURL: `${assetsCacheURLPrefix}/investors/vibe_capital.jpeg`,
    website: 'https://vibecap.co',
    twitter: 'vibe_cap',
  },
  {
    id: 'longhash_ventures',
    name: 'LongHash Ventures',
    description:
      "Asia's leading Web3 investment fund and accelerator collaborating with founders to build their Web3 model and tap into the vast potential of Asia.",
    involvement: 'Initially Invested in July 2022',
    imageURL: `${assetsCacheURLPrefix}/investors/longhash_ventures.jpeg`,
    website: 'https://longhash.vc',
    twitter: 'LongHashVC',
  },
  {
    id: 'micheal_stoppelman',
    name: 'Michael Stoppelman',
    description:
      'Investor in Flexport, Vanta, and Benchling, Former SVP of Engineering at Yelp & ex-Google Software Engineer',
    involvement: 'Initially Invested in Feb 2021',
    imageURL: `${assetsCacheURLPrefix}/investors/micheal_stoppelman.jpeg`,
    twitter: 'stopman',
    linkedin: 'in/michaelstoppelman',
  },
  {
    id: 'hursh_agrawal',
    name: 'Hursh Agrawal',
    description: 'Cofounder of The Browser Company',
    involvement: 'Initially Invested in Feb 2021',
    imageURL: `${assetsCacheURLPrefix}/investors/hursh_agrawal.jpeg`,
    twitter: 'hursh',
    linkedin: 'in/hurshagrawal',
  },
  {
    id: 'adam_midvidy',
    name: 'Adam Midvidy',
    description: 'Developer at Jane Street',
    involvement: 'Initially Invested in Feb 2021',
    imageURL: `${assetsCacheURLPrefix}/investors/adam_midvidy.jpeg`,
    twitter: 'amidvidy',
  },
  {
    id: 'dan_shipper',
    name: 'Dan Shipper',
    description: 'CEO of Every',
    involvement: 'Initially Invested in Feb 2021',
    imageURL: `${assetsCacheURLPrefix}/investors/dan_shipper.jpeg`,
    twitter: 'danshipper',
    linkedin: 'in/danshipper',
  },
  {
    id: 'mary_pimenova',
    name: 'Mary Pimenova',
    description: 'Senior Engineering Manager at Robinhood',
    involvement: 'Initially Invested in Feb 2021',
    imageURL: `${assetsCacheURLPrefix}/investors/mary_pimenova.jpeg`,
    linkedin: 'in/mpimenova',
  },
  {
    id: 'ranjan_pradeep',
    name: 'Ranjan Pradeep',
    description: 'Software Engineer at Microsoft',
    involvement: 'Initially Invested in Feb 2021',
    imageURL: `${assetsCacheURLPrefix}/investors/ranjan_pradeep.jpeg`,
  },
  {
    id: 'tyler_menezes',
    name: 'Tyler Menezes',
    description:
      'Helping kids find a place in tech at CodeDay. Forbes 30 Under 30, 425 Mag 30 Under 30. Tech & Learning Influential in EdTech.',
    involvement: 'Initially Invested in Feb 2021',
    imageURL: `${assetsCacheURLPrefix}/investors/tyler_menezes.jpeg`,
    twitter: 'tylermenezes',
    linkedin: 'in/tylermenezes',
  },
  {
    id: 'alex_esibov',
    name: 'Alex Esibov',
    description: 'Principal Lead Product Manager at Microsoft',
    involvement: 'Initially Invested in Feb 2021',
    imageURL: `${assetsCacheURLPrefix}/investors/alex_esibov.jpeg`,
    twitter: 'AlexEsibov',
    linkedin: 'in/alexesibov',
  },
  {
    id: 'inna_turshudzhyan',
    name: 'Inna Turshudzhyan',
    description: 'Senior Software Engineer at Microsoft',
    involvement: 'Initially Invested in Feb 2021',
    imageURL: `${assetsCacheURLPrefix}/investors/inna_turshudzhyan.jpeg`,
  },
  {
    id: 'nick_mauro',
    name: 'Nick Mauro',
    description:
      'Comm is building a messaging service that puts encryption and decentralization first. Thrilled to be among the group of early investors.',
    involvement: 'Initially Invested in Feb 2021',
    imageURL: `${assetsCacheURLPrefix}/investors/nick_mauro.jpeg`,
    twitter: '0x7BA086',
  },
  {
    id: 'josh_kornreich',
    name: 'Josh Kornreich',
    description:
      'Managing Partner at Unit Engineering Group and CTO at Ignite Tournaments',
    involvement: 'Initially Invested in May 2020',
    imageURL: `${assetsCacheURLPrefix}/investors/josh_kornreich.jpeg`,
    linkedin: 'in/joshuakornreich',
  },
  {
    id: 'lucas_lowman',
    name: 'Lucas Lowman',
    description: 'Creative Director at Weirdbreak',
    involvement: 'Initially Invested in Feb 2021',
    imageURL: `${assetsCacheURLPrefix}/investors/lucas_lowman.jpeg`,
    linkedin: 'in/lucaslowman',
  },
  {
    id: 'jonathan_shi',
    name: 'Jonathan Shi',
    description: 'Postdoctoral Researcher',
    involvement: 'Initially Invested in Feb 2021',
    imageURL: `${assetsCacheURLPrefix}/investors/jonathan_shi.jpeg`,
    website: 'https://www.jshi.science',
    twitter: 'jtnshi',
  },
  {
    id: 'larry_fenn',
    name: 'Larry Fenn',
    description: 'Data journalist at Associated Press',
    involvement: 'Initially Invested in Feb 2021',
    imageURL: `${assetsCacheURLPrefix}/investors/larry_fenn.jpeg`,
    website: 'https://larryfenn.com',
  },
  {
    id: 'dave_lowman',
    name: 'Dave Lowman',
    description:
      'Senior Financial Services Executive, Board Member and Entrepreneur',
    involvement: 'Initially Invested in Feb 2021',
    imageURL: `${assetsCacheURLPrefix}/investors/dave_lowman.jpeg`,
    linkedin: 'in/dave-lowman-a90bb81',
  },
  {
    id: 'jason_yeh',
    name: 'Jason Yeh',
    description: 'Founder at Adamant. Previously at Greycroft VC.',
    involvement: 'Initially Invested in Feb 2021',
    imageURL: `${assetsCacheURLPrefix}/investors/jason_yeh.jpeg`,
    twitter: 'jayyeh',
  },
  {
    id: 'blake_embrey',
    name: 'Blake Embrey',
    description: 'Senior Software Engineer at Opendoor.com',
    involvement: 'Initially Invested in Feb 2021',
    imageURL: `${assetsCacheURLPrefix}/investors/blake_embrey.jpeg`,
    website: 'http://blakeembrey.me',
    twitter: 'blakeembrey',
    linkedin: 'in/blakeembrey',
  },
  {
    id: 'ted_kalaw',
    name: 'Ted Kalaw',
    description:
      'Software Engineer at Yoz Labs. Previously Senior Software Engineer at UnitedMasters and Facebook.',
    involvement: 'Initially Invested in Feb 2021',
    imageURL: `${assetsCacheURLPrefix}/investors/ted_kalaw.jpeg`,
    linkedin: 'in/ted-kalaw-791a0541',
  },
  {
    id: 'jack_arenas',
    name: 'Jack Arenas',
    description:
      'Co-founder CTO at Modern Life and Co-founder at Petal. Previously Goldman Sachs and Amazon.',
    involvement: 'Initially Invested in Feb 2021',
    imageURL: `${assetsCacheURLPrefix}/investors/jack_arenas.jpeg`,
    twitter: 'jackarenas',
    linkedin: 'in/jackarenas',
  },
  {
    id: 'dave_schatz',
    name: 'Dave Schatz',
    description:
      'Entrepreneur, engineer, blockchain dev, angel investor. Previously at Circles For Zoom and Facebook.',
    involvement: 'Initially Invested in Feb 2021',
    imageURL: `${assetsCacheURLPrefix}/investors/dave_schatz.jpeg`,
    twitter: 'daveschatz',
    linkedin: 'in/daveschatz',
  },
  {
    id: 'michelle_nacouzi',
    name: 'Michelle Nacouzi',
    description: 'Early-stage VC at Northzone',
    involvement: 'Initially Invested in Feb 2021',
    imageURL: `${assetsCacheURLPrefix}/investors/michelle_nacouzi.jpeg`,
    twitter: 'MichelleNacouzi',
  },
  {
    id: 'rousseau_kazi',
    name: 'Rousseau Kazi',
    description: 'CEO at Threads',
    involvement: 'Initially Invested in Feb 2021',
    imageURL: `${assetsCacheURLPrefix}/investors/rousseau_kazi.jpeg`,
    twitter: 'rousseaukazi',
    linkedin: 'in/rousseaukazi',
  },
  {
    id: 'liu_jiang',
    name: 'Liu Jiang',
    description: 'Investor and Advisor',
    involvement: 'Initially Invested in Feb 2021',
    imageURL: `${assetsCacheURLPrefix}/investors/liu_jiang.jpeg`,
    linkedin: 'in/liujiang1',
  },
  {
    id: 'jan_karl_driscoll',
    name: 'Jan-Karl Driscoll',
    description: 'Software Engineer and Architect. Previously at BounceX.',
    involvement: 'Initially Invested in Feb 2021',
    imageURL: `${assetsCacheURLPrefix}/investors/jan_karl_driscoll.jpeg`,
    linkedin: 'in/jan-karl-driscoll-91254a3',
  },
  {
    id: 'tess_rinearson',
    name: 'Tess Rinearson',
    description:
      'Leads Blockchain at Twitter. Previously the VP of Engineering at the Interchain Foundation.',
    involvement: 'Initially Invested in Mar 2021',
    imageURL: `${assetsCacheURLPrefix}/investors/tess_rinearson.jpeg`,
    twitter: '_tessr',
    linkedin: 'in/temiri',
  },
  {
    id: 'ashwin_bhat',
    name: 'Ashwin Bhat',
    description: 'Engineering Manager at Loom',
    involvement: 'Initially Invested in Mar 2021',
    imageURL: `${assetsCacheURLPrefix}/investors/ashwin_bhat.jpeg`,
    twitter: 'swac',
    linkedin: 'in/ashwin-bhat-23573222',
  },
  {
    id: 'lev_dubinets',
    name: 'Lev Dubinets',
    description: 'Enerineering Manager at Mercury',
    imageURL: `${assetsCacheURLPrefix}/investors/lev_dubinets.jpeg`,
    twitter: 'LevDubinets',
  },
  {
    id: 'charlie_songhurst',
    name: 'Charlie Songhurst',
    description:
      'Private investor in tech companies. Previously at Microsoft and McKinsey.',
    involvement: 'Initially Invested in Mar 2021',
    imageURL: `${assetsCacheURLPrefix}/investors/charlie_songhurst.jpeg`,
    linkedin: 'in/charlessonghurst',
  },
  {
    id: 'edward_lando',
    name: 'Edward Lando',
    description: 'Managing Partner at Pareto Holdings',
    involvement: 'Initially Invested in Mar 2021',
    imageURL: `${assetsCacheURLPrefix}/investors/edward_lando.jpeg`,
    twitter: 'edwardlando',
    linkedin: 'in/edwardlando',
  },
  {
    id: 'alina_libova_cohen',
    name: 'Alina Libova Cohen',
    description: 'Angel Investor',
    involvement: 'Initially Invested in Mar 2021',
    imageURL: `${assetsCacheURLPrefix}/investors/alina_libova_cohen.jpeg`,
    twitter: 'alina_libova',
  },
  {
    id: 'kahren_tevosyan',
    name: 'Kahren Tevosyan',
    description: 'VP of Engineering at Microsoft',
    involvement: 'Initially Invested in Mar 2021',
    imageURL: `${assetsCacheURLPrefix}/investors/kahren_tevosyan.jpeg`,
  },
  {
    id: 'anna_barhudarian',
    name: 'Anna Barhudarian',
    description: "Ashoat's mother and Principal PM Manager at Microsoft",
    involvement: 'Initially Invested in Mar 2021',
    imageURL: `${assetsCacheURLPrefix}/investors/anna_barhudarian.jpeg`,
  },
  {
    id: 'jim_posen',
    name: 'Jim Posen',
    description:
      'Cryptography engineer. Previously technical lead at Coinbase.',
    involvement: 'Initially Invested in Nov 2021',
    imageURL: `${assetsCacheURLPrefix}/investors/jim_posen.jpeg`,
    twitter: 'jimpo_potamus',
    linkedin: 'in/jimpo',
  },
  {
    id: 'chet_corcos',
    name: 'Chet Corcos',
    description: 'Previously engineer at Notion, Affirm, and SpaceX',
    involvement: 'Initially Invested in Nov 2021',
    imageURL: `${assetsCacheURLPrefix}/investors/chet_corcos.jpeg`,
    website: 'http://chetcorcos.com',
    twitter: 'ccorcos',
  },
  {
    id: 'eric_siu',
    name: 'Eric Siu',
    description:
      'Founder at Single Grain. Investor and creator at Leveling up Heroes.',
    involvement: 'Initially Invested in Nov 2021',
    imageURL: `${assetsCacheURLPrefix}/investors/eric_siu.jpeg`,
    twitter: 'ericosiu',
    linkedin: 'in/ericosiu',
  },
  {
    id: 'gmoney',
    name: 'gmoney',
    description: 'Founder at Admit One and 9dcc',
    involvement: 'Initially Invested in Nov 2021',
    imageURL: `${assetsCacheURLPrefix}/investors/gmoney.jpeg`,
    twitter: 'gmoneyNFT',
  },
  {
    id: 'dylan_portelance',
    name: 'Dylan Portelance',
    description: 'Product Growth at Photomath',
    involvement: 'Initially Invested in Nov 2021',
    imageURL: `${assetsCacheURLPrefix}/investors/dylan_portelance.jpeg`,
    twitter: 'dylanjpo',
    linkedin: 'in/dylanportelance',
  },
  {
    id: 'lisa_xu',
    name: 'Lisa Xu',
    description:
      'VC at FirstMark investing in early stage consumer and web3 startups. Co-host of Crypto Driven.',
    involvement: 'Initially Invested in Nov 2021',
    imageURL: `${assetsCacheURLPrefix}/investors/lisa_xu.jpeg`,
    twitter: 'lisamxu',
  },
  {
    id: 'mark_mullen',
    name: 'Mark Mullen',
    description:
      'Managing Partner at Double M and Co-Founder at Bonfire Ventures',
    involvement: 'Initially Invested in Nov 2021',
    imageURL: `${assetsCacheURLPrefix}/investors/mark_mullen.jpeg`,
    website: 'https://www.bonfirevc.com/team/mark-mullen',
  },
  {
    id: 'reuben_bramanathan',
    name: 'Reuben Bramanathan',
    description:
      'General Partner at IDEO CoLab Ventures. Previously Head of Asset Management and Product Counsel at Coinbase.',
    involvement: 'Initially Invested in Nov 2021',
    imageURL: `${assetsCacheURLPrefix}/investors/reuben_bramanathan.jpeg`,
    twitter: 'bramanathan',
    linkedin: 'in/rbramanathan',
  },
  {
    id: 'balaji_srinivasan',
    name: 'Balaji Srinivasan',
    description:
      'Author of The Network State. Formerly the CTO of Coinbase and General Partner at Andreessen Horowitz.',
    involvement: 'Initially Invested in Nov 2021',
    imageURL: `${assetsCacheURLPrefix}/investors/balaji_srinivasan.jpeg`,
    twitter: 'balajis',
  },
  {
    id: 'david_rodriguez',
    name: 'David Rodriguez',
    description: 'Co-Founder and Managing Partner at Draft Ventures',
    involvement: 'Initially Invested in Dec 2021',
    imageURL: `${assetsCacheURLPrefix}/investors/david_rodriguez.jpeg`,
    twitter: 'davidjrodriguez',
    linkedin: 'in/davidjrodriguez',
  },
  {
    id: 'artia_moghbel',
    name: 'Artia Moghbel',
    description: 'Co-founder at Draft Ventures. Previously the COO at DFINITY.',
    involvement: 'Initially Invested in Dec 2021',
    imageURL: `${assetsCacheURLPrefix}/investors/artia_moghbel.jpeg`,
    twitter: 'artia',
    linkedin: 'in/artiam',
  },
  {
    id: 'grant_gittlin',
    name: 'Grant Gittlin',
    description: 'Investor & Former CGO at MediaLink',
    involvement: 'Initially Invested in Jan 2022',
    imageURL: `${assetsCacheURLPrefix}/investors/grant_gittlin.jpeg`,
    linkedin: 'in/grantgittlin',
  },
  {
    id: 'julian_weisser',
    name: 'Julian Weisser',
    description:
      'Co-Founder of On Deck. Ex-core at Constitution DAO and GP at Other Ventures.',
    involvement: 'Initially Invested in Jan 2022',
    imageURL: `${assetsCacheURLPrefix}/investors/julian_weisser.jpeg`,
    twitter: 'julianweisser',
    linkedin: 'in/julianweisser',
  },
  {
    id: 'ethan_beard',
    name: 'Ethan Beard',
    description: 'Co-Founder at Yoz Labs. Previously Senior VP at Ripple.',
    involvement: 'Initially Invested in Jan 2022',
    imageURL: `${assetsCacheURLPrefix}/investors/ethan_beard.jpeg`,
    twitter: 'ethanbeard',
    linkedin: 'in/ethanbeard',
  },
  {
    id: 'tim_chen',
    name: 'Tim Chen',
    description:
      'General Partner at Essence VC. Co-host of the Open Source Startup Podcast.',
    involvement: 'Initially Invested in Jan 2022',
    imageURL: `${assetsCacheURLPrefix}/investors/tim_chen.jpeg`,
    twitter: 'tnachen',
    linkedin: 'in/timchen',
  },
  {
    id: 'jennifer_liu',
    name: 'Jennifer Liu',
    description: 'Founding Partner at D1 Ventures.',
    involvement: 'Initially Invested in Jan 2022',
    imageURL: `${assetsCacheURLPrefix}/investors/jennifer_liu.jpeg`,
  },
  {
    id: 'tamara_frankel',
    name: 'Tamara Frankel',
    description:
      'Founding Partner at D1 Ventures. Previously Founding Partner at Azoth Group.',
    involvement: 'Initially Invested in Feb 2022',
    imageURL: `${assetsCacheURLPrefix}/investors/tamara_frankel.jpeg`,
    linkedin: 'in/tamara-based-jpegs',
  },
  {
    id: 'ahmed_jafri',
    name: 'Ahmed Jafri',
    description: 'Engineering Manager at Meta',
    involvement: 'Initially Invested in Jan 2022',
    imageURL: `${assetsCacheURLPrefix}/investors/ahmed_jafri.jpeg`,
    twitter: 'ahmedjafrii',
    linkedin: 'in/ahmedjafrii',
  },
  {
    id: 'aksel_piran',
    name: 'Aksel Piran',
    description: 'Founder at CP3 Ventures and The Syndicate by BANA',
    involvement: 'Initially Invested in Jan 2022',
    imageURL: `${assetsCacheURLPrefix}/investors/aksel_piran.jpeg`,
    linkedin: 'in/apiran',
  },
  {
    id: 'paul_veradittakit',
    name: 'Paul Veradittakit',
    description: 'Investor at Pantera Capital',
    involvement: 'Initially Invested in Feb 2022',
    imageURL: `${assetsCacheURLPrefix}/investors/paul_veradittakit.jpeg`,
    twitter: 'veradittakit',
    linkedin: 'in/veradittakit',
  },
  {
    id: 'ammar_karmali',
    name: 'Ammar Karmali',
    description:
      'Investment Banking Associate at Gordon Dyal & Co. Advisory Group LP',
    involvement: 'Initially Invested in Feb 2022',
    imageURL: `${assetsCacheURLPrefix}/investors/ammar_karmali.jpeg`,
    linkedin: 'in/ammar-karmali-658b10b4',
  },
  {
    id: 'avi_zurlo',
    name: 'Avi Zurlo',
    description: 'Ventures Associate at Delphi Digital',
    involvement: 'Initially Invested in Feb 2022',
    imageURL: `${assetsCacheURLPrefix}/investors/avi_zurlo.jpeg`,
    twitter: 'thejewforu',
    linkedin: 'in/avi-zurlo-2b0760104',
  },
  {
    id: 'tom_shaughnessy',
    name: 'Tom Shaughnessy',
    description: 'Co-Founder at Delphi Digital. Host of The Delphi Podcast.',
    involvement: 'Initially Invested in Feb 2022',
    imageURL: `${assetsCacheURLPrefix}/investors/tom_shaughnessy.jpeg`,
    twitter: 'Shaughnessy119',
    linkedin: 'in/tom-shaughnessy-jr-2572a220',
  },
  {
    id: 'yan_liberman',
    name: 'Yan Liberman',
    description: 'Co-Founder at Delphi Digital',
    involvement: 'Initially Invested in Feb 2022',
    imageURL: `${assetsCacheURLPrefix}/investors/yan_liberman.jpeg`,
    twitter: 'YanLiberman',
    linkedin: 'in/yanliberman',
  },
  {
    id: 'faizan_khan',
    name: 'Faizan Khan',
    description: 'Founder, Managing Director at Visary Capital',
    involvement: 'Initially Invested in July 2022',
    imageURL: `${assetsCacheURLPrefix}/investors/faizan_khan.jpeg`,
    linkedin: 'in/faizanjkhan',
  },
  {
    id: 'lane_rettig',
    name: 'Lane Rettig',
    description: 'Core team at teamspacemesh. Previously Ethereum Core Dev.',
    involvement: 'Initially Invested in July 2022',
    imageURL: `${assetsCacheURLPrefix}/investors/lane_rettig.jpeg`,
    twitter: 'lrettig',
    linkedin: 'in/lane-rettig-32904b227',
  },
  {
    id: 'lon_lundgren',
    name: 'Lon Lundgren',
    description:
      'Founder at Galactical and Ocelot. Previously at AWS and Microsoft.',
    imageURL: `${assetsCacheURLPrefix}/investors/lon_lundgren.jpeg`,
    linkedin: 'in/lonlundgren',
  },
  {
    id: 'will_papper',
    name: 'Will Papper',
    description: 'Co-Founder at Syndicate DAO. Core at Constitution DAO.',
    involvement: 'Initially Invested in July 2022',
    imageURL: `${assetsCacheURLPrefix}/investors/will_papper.jpeg`,
    twitter: 'WillPapper',
  },
  {
    id: 'sida_li',
    name: 'Sida Li',
    description:
      'Strategy at SyndicateDAO. Previously built ventures at IDEO and Atomic.',
    involvement: 'Initially Invested in July 2022',
    imageURL: `${assetsCacheURLPrefix}/investors/sida_li.jpeg`,
    twitter: 'Sidaelle',
    linkedin: 'in/sida-li-35729698',
  },
  {
    id: 'reverie',
    name: 'Reverie',
    description: 'Reverie helps DAOs grow',
    involvement: 'Initially Invested in July 2022',
    imageURL: `${assetsCacheURLPrefix}/investors/reverie.jpeg`,
    website: 'https://www.reverie.ooo',
    twitter: 'hi_reverie',
    linkedin: 'company/reveriereserves',
  },
  {
    id: 'patricio_worthalter',
    name: 'Patricio Worthalter',
    description: 'Founder at POAP',
    involvement: 'Initially Invested in July 2022',
    imageURL: `${assetsCacheURLPrefix}/investors/patricio_worthalter.jpeg`,
    twitter: 'in/worthalter',
  },
  {
    id: 'andrew_green',
    name: 'Andrew Green',
    description:
      'Co-Founder & CEO of Strider. Previously, Partner at Andreessen Horowitz.',
    involvement: 'Initially Invested in July 2022',
    imageURL: `${assetsCacheURLPrefix}/investors/andrew_green.jpeg`,
    linkedin: 'in/andrewngreen10',
  },
  {
    id: 'taylor_rogalski',
    name: 'Taylor Rogalski',
    description:
      'Former Product Designer at Facebook, Pioneerp.app, and ClassDojo',
    involvement: 'Advisor since Feb 2021',
    imageURL: `${assetsCacheURLPrefix}/investors/taylor_rogalski.jpeg`,
    twitter: 'tayroga',
    linkedin: 'in/taylor-rogalski-4b169767',
  },
  {
    id: 'julia_lipton',
    name: 'Julia Lipton',
    description: 'Investing in Web3 at Awesome People Ventures',
    imageURL: `${assetsCacheURLPrefix}/investors/julia_lipton.jpeg`,
    involvement: 'Advisor since Oct 2021',
    twitter: 'JuliaLipton',
    linkedin: 'in/julialipton',
  },
  {
    id: 'varun_dhananjaya',
    name: 'Varun Dhananjaya',
    description: 'Software Engineer at Comm',
    involvement: 'Joined July 2022',
    imageURL: `${assetsCacheURLPrefix}/investors/varun_dhananjaya.jpeg`,
  },
  {
    id: 'mark_rafferty',
    name: 'Mark Rafferty',
    description: 'Recruiter at Comm',
    involvement: 'Joined Feb 2022',
    imageURL: `${assetsCacheURLPrefix}/investors/mark_rafferty.jpeg`,
    twitter: 'markraff',
  },
];

const shuffledInvestorsData: $ReadOnlyArray<Investors> = _shuffle(
  investorsData,
);

const keyedInvestorData: { [key: string]: Investors } = _keyBy('id')(
  investorsData,
);

export { shuffledInvestorsData, keyedInvestorData };
