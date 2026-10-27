# News categories

## User story

As a reader, I choose Arts and the globe shows arts stories in view. I narrow that to music, then to jazz music, and the globe shows only that branch. I open Arts, or music, or jazz music, and read the latest stories there without moving the globe. The same path works for every other branch: Finance, then economy, then central bank.

Every topic APITube publishes is a row in this list, so whichever one I choose is a filter.

## Source

APITube classifies an article with IPTC Media Topics. Its published catalog is 1,085 topics under 17 top-level subjects. APITube's own filter matches the exact id and skips children, and a request accepts at most three ids. Ingestion files each topic on our row for that id and on every ancestor, so choosing Finance includes central bank, and choosing music includes jazz music.

An article APITube leaves uncategorized is filed as General. General is outside the 1,085.

Names are the ones APITube publishes. The parent of each topic comes from the IPTC Media Topics tree (cv.iptc.org, released 2026-09-30). Thirty-three of these ids are retired in that vocabulary and still appear in APITube's list, so they stay here. Seven newer IPTC topics are absent until APITube adds them.

## Categories

These seventeen are the menu. The count is the category plus every topic under it.

| Category | Id | Medtop | Topics |
| --- | --- | --- | --- |
| Politics | 1 | `medtop:11000000` | 89 |
| Conflict | 2 | `medtop:16000000` | 29 |
| Crime | 3 | `medtop:02000000` | 67 |
| Disaster | 4 | `medtop:03000000` | 29 |
| Weather | 5 | `medtop:17000000` | 5 |
| Finance | 6 | `medtop:04000000` | 203 |
| Tech | 7 | `medtop:13000000` | 56 |
| Health | 8 | `medtop:07000000` | 49 |
| Environment | 9 | `medtop:06000000` | 32 |
| Sport | 10 | `medtop:15000000` | 211 |
| Arts | 11 | `medtop:01000000` | 73 |
| Lifestyle | 12 | `medtop:10000000` | 55 |
| Education | 13 | `medtop:05000000` | 23 |
| Labour | 14 | `medtop:09000000` | 27 |
| Society | 15 | `medtop:14000000` | 72 |
| Religion | 16 | `medtop:12000000` | 51 |
| Human interest | 17 | `medtop:08000000` | 14 |
| General | 18 | — | 1 |

When an article matches more than one category, the pin uses the first match in the order of this table. The article still appears under every category it matched, so a Finance filter still returns it when Finance is one of its topics.

## Subcategories

Each row is a filter. `Id` is the integer primary key. `Parent` is the id of the topic directly above it. A row whose parent is a menu id is the first list after that category. Deeper rows are the next lists. Filtering a row includes the topics under it.

The menu ids are 1 through 18, in the order of the table above. Every other topic continues from 19. Two rows can share a name, such as crime under Crime. The integer is what tells them apart.

### Politics

`1` · `medtop:11000000` · politics and government · 89 topics, including this one.

| Level | Name | Id | Medtop | Parent |
| --- | --- | --- | --- | --- |
| 0 | politics and government | 1 | `medtop:11000000` |  |
| 1 | election | 52 | `medtop:20000574` | 1 |
| 2 | by-election | 195 | `medtop:20001380` | 52 |
| 2 | campaign finance | 196 | `medtop:20000581` | 52 |
| 2 | citizens' initiative and recall | 217 | `medtop:20000575` | 52 |
| 2 | coalition building | 222 | `medtop:20001382` | 52 |
| 2 | intergovernmental elections | 381 | `medtop:20000577` | 52 |
| 2 | local elections | 411 | `medtop:20000578` | 52 |
| 2 | national elections | 452 | `medtop:20000579` | 52 |
| 2 | political candidates | 495 | `medtop:20000582` | 52 |
| 2 | political debates | 497 | `medtop:20001266` | 52 |
| 2 | primary elections | 515 | `medtop:20000583` | 52 |
| 2 | recall election | 531 | `medtop:20001381` | 52 |
| 2 | referendum | 533 | `medtop:20000584` | 52 |
| 2 | regional elections | 537 | `medtop:20000585` | 52 |
| 2 | voting | 633 | `medtop:20000586` | 52 |
| 2 | voting system | 634 | `medtop:20000576` | 52 |
| 1 | government | 61 | `medtop:20000593` | 1 |
| 2 | constitution (law) | 232 | `medtop:20000597` | 61 |
| 2 | executive (government) | 297 | `medtop:20000606` | 61 |
| 2 | government budget | 336 | `medtop:20000607` | 61 |
| 2 | government employee | 337 | `medtop:20000595` | 61 |
| 2 | head of government | 344 | `medtop:20001261` | 61 |
| 2 | head of state | 345 | `medtop:20000610` | 61 |
| 2 | impeachment | 372 | `medtop:20000611` | 61 |
| 2 | legislative body | 402 | `medtop:20000615` | 61 |
| 3 | lower house (legislature) | 854 | `medtop:20000616` | 402 |
| 3 | upper house (legislature) | 1018 | `medtop:20000617` | 402 |
| 2 | lobbying | 409 | `medtop:20000650` | 61 |
| 2 | local authority | 410 | `medtop:20000612` | 61 |
| 2 | minister or secretary (government) | 437 | `medtop:20000613` | 61 |
| 2 | national government | 453 | `medtop:20000614` | 61 |
| 2 | national security | 455 | `medtop:20000598` | 61 |
| 3 | armed forces | 674 | `medtop:20000599` | 455 |
| 4 | military service | 1057 | `medtop:20001145` | 674 |
| 4 | veterans' affairs | 1078 | `medtop:20000600` | 674 |
| 3 | espionage and intelligence | 774 | `medtop:20000605` | 455 |
| 3 | military weaponry and equipment | 867 | `medtop:20000602` | 455 |
| 2 | political committee | 496 | `medtop:20001260` | 61 |
| 2 | political leadership | 498 | `medtop:20001312` | 61 |
| 2 | political movement and association | 499 | `medtop:20001385` | 61 |
| 2 | political party | 500 | `medtop:20001384` | 61 |
| 2 | political party convention | 501 | `medtop:20001259` | 61 |
| 2 | political system | 503 | `medtop:20000653` | 61 |
| 3 | absolute monarchy | 657 | `medtop:20001389` | 503 |
| 3 | communism | 724 | `medtop:20001386` | 503 |
| 3 | democracy | 745 | `medtop:20000654` | 503 |
| 3 | democratic socialism | 746 | `medtop:20001387` | 503 |
| 3 | dictatorship | 751 | `medtop:20000655` | 503 |
| 3 | theocracy | 1002 | `medtop:20001388` | 503 |
| 2 | public inquiry | 523 | `medtop:20001262` | 61 |
| 2 | public officials | 524 | `medtop:20000596` | 61 |
| 2 | regional authority | 535 | `medtop:20000618` | 61 |
| 1 | government policy | 63 | `medtop:20000621` | 1 |
| 2 | cultural policy | 245 | `medtop:20001132` | 63 |
| 2 | data protection policy | 253 | `medtop:20000627` | 63 |
| 2 | economic policy | 274 | `medtop:20000345` | 63 |
| 3 | economic development incentive | 762 | `medtop:20001292` | 274 |
| 3 | nationalisation | 883 | `medtop:20000623` | 274 |
| 3 | privatisation | 916 | `medtop:20000624` | 274 |
| 3 | state-owned enterprise | 981 | `medtop:20000625` | 274 |
| 2 | education policy | 279 | `medtop:20001338` | 63 |
| 2 | environmental policy | 293 | `medtop:20000423` | 63 |
| 2 | healthcare policy | 349 | `medtop:20000479` | 63 |
| 2 | housing and urban planning policy | 363 | `medtop:20000628` | 63 |
| 2 | immigration policy | 371 | `medtop:20000634` | 63 |
| 2 | infrastructure policy | 379 | `medtop:20001264` | 63 |
| 2 | local government policy | 412 | `medtop:20001265` | 63 |
| 2 | nuclear policy | 462 | `medtop:20000635` | 63 |
| 2 | pension and welfare policy | 484 | `medtop:20000630` | 63 |
| 2 | personal weapon control policy | 487 | `medtop:20000632` | 63 |
| 2 | policy towards indigenous people | 494 | `medtop:20000629` | 63 |
| 2 | regional development policy | 536 | `medtop:20001174` | 63 |
| 2 | regulation of industry | 539 | `medtop:20000636` | 63 |
| 3 | food and drink regulations | 789 | `medtop:20000637` | 539 |
| 2 | sports policies | 588 | `medtop:20001147` | 63 |
| 2 | taxation policy | 604 | `medtop:20000620` | 63 |
| 2 | zoning policy | 653 | `medtop:20001383` | 63 |
| 1 | international relations | 71 | `medtop:20000638` | 1 |
| 2 | border dispute | 183 | `medtop:20001316` | 71 |
| 2 | diplomacy | 260 | `medtop:20000639` | 71 |
| 3 | summit meeting | 987 | `medtop:20000640` | 260 |
| 3 | treaty | 1014 | `medtop:20000641` | 260 |
| 2 | economic sanction | 275 | `medtop:20000642` | 71 |
| 2 | foreign aid | 316 | `medtop:20000643` | 71 |
| 2 | international organisation | 385 | `medtop:20000644` | 71 |
| 2 | refugees and internally displaced people | 534 | `medtop:20000645` | 71 |
| 1 | non-governmental organisation (NGO) | 87 | `medtop:20000646` | 1 |
| 1 | political prisoners and dissenters | 92 | `medtop:20000648` | 1 |

### Conflict

`2` · `medtop:16000000` · conflict, war and peace · 29 topics, including this one.

| Level | Name | Id | Medtop | Parent |
| --- | --- | --- | --- | --- |
| 0 | conflict, war and peace | 2 | `medtop:16000000` |  |
| 1 | act of terror | 20 | `medtop:20000053` | 2 |
| 2 | act of bioterrorism | 140 | `medtop:20000054` | 20 |
| 2 | terrorist bombings | 610 | `medtop:20000055` | 20 |
| 1 | armed conflict | 22 | `medtop:20000056` | 2 |
| 2 | guerrilla activity | 339 | `medtop:20000057` | 22 |
| 2 | international military intervention | 384 | `medtop:20000058` | 22 |
| 2 | military occupation | 436 | `medtop:20000060` | 22 |
| 2 | war | 637 | `medtop:20000062` | 22 |
| 3 | civil war | 717 | `medtop:20000063` | 637 |
| 1 | civil unrest | 32 | `medtop:20000065` | 2 |
| 2 | demonstration | 257 | `medtop:20000066` | 32 |
| 2 | rebellion | 530 | `medtop:20000067` | 32 |
| 2 | revolution | 542 | `medtop:20000068` | 32 |
| 2 | riot | 544 | `medtop:20000069` | 32 |
| 1 | coup d'etat | 37 | `medtop:20000070` | 2 |
| 1 | cyber warfare | 41 | `medtop:20001361` | 2 |
| 1 | massacre | 81 | `medtop:20000071` | 2 |
| 1 | peace process | 90 | `medtop:20000073` | 2 |
| 2 | disarmament | 262 | `medtop:20000078` | 90 |
| 2 | peace envoy | 479 | `medtop:20000074` | 90 |
| 2 | peace plan | 480 | `medtop:20000075` | 90 |
| 2 | peace talks | 481 | `medtop:20000076` | 90 |
| 2 | peacekeeping force | 482 | `medtop:20000059` | 90 |
| 1 | post-war reconstruction | 93 | `medtop:20000077` | 2 |
| 2 | ordnance clearance | 466 | `medtop:20000079` | 93 |
| 1 | war victims | 132 | `medtop:20001377` | 2 |
| 2 | missing in action | 438 | `medtop:20000061` | 132 |
| 2 | prisoners of war | 516 | `medtop:20000080` | 132 |

### Crime

`3` · `medtop:02000000` · crime, law and justice · 67 topics, including this one.

| Level | Name | Id | Medtop | Parent |
| --- | --- | --- | --- | --- |
| 0 | crime, law and justice | 3 | `medtop:02000000` |  |
| 1 | crime | 38 | `medtop:20000082` | 3 |
| 2 | animal abuse | 154 | `medtop:20001314` | 38 |
| 2 | arson | 162 | `medtop:20000083` | 38 |
| 2 | assault | 165 | `medtop:20000084` | 38 |
| 3 | sex crime | 963 | `medtop:20000085` | 165 |
| 2 | corporate crime | 236 | `medtop:20000087` | 38 |
| 3 | accounting crime | 659 | `medtop:20001194` | 236 |
| 3 | anti-trust crime | 669 | `medtop:20000088` | 236 |
| 3 | breach of contract | 701 | `medtop:20000089` | 236 |
| 3 | embezzlement | 768 | `medtop:20000090` | 236 |
| 3 | insider trading | 827 | `medtop:20000091` | 236 |
| 3 | restraint of trade | 944 | `medtop:20000092` | 236 |
| 2 | corruption | 237 | `medtop:20000093` | 38 |
| 3 | bribery | 703 | `medtop:20000094` | 237 |
| 2 | cyber crime | 249 | `medtop:20000086` | 38 |
| 2 | drug related crimes | 269 | `medtop:20000095` | 38 |
| 3 | drug trafficking | 759 | `medtop:20000096` | 269 |
| 2 | fraud | 321 | `medtop:20000097` | 38 |
| 3 | tax evasion | 996 | `medtop:20001195` | 321 |
| 2 | genocide | 329 | `medtop:20000072` | 38 |
| 2 | hijacking | 351 | `medtop:20000098` | 38 |
| 2 | homicide | 357 | `medtop:20000099` | 38 |
| 2 | human smuggling and trafficking | 366 | `medtop:20001283` | 38 |
| 2 | kidnapping | 396 | `medtop:20000100` | 38 |
| 2 | organised crime | 468 | `medtop:20000101` | 38 |
| 3 | gang activity | 795 | `medtop:20000102` | 468 |
| 2 | reckless driving | 532 | `medtop:20001196` | 38 |
| 2 | robbery and theft | 546 | `medtop:20000104` | 38 |
| 2 | shootings | 568 | `medtop:20001313` | 38 |
| 2 | terrorism | 609 | `medtop:20000103` | 38 |
| 2 | torture | 614 | `medtop:20001320` | 38 |
| 2 | vandalism | 629 | `medtop:20001285` | 38 |
| 2 | war crime | 638 | `medtop:20000105` | 38 |
| 1 | judiciary | 72 | `medtop:20000106` | 3 |
| 2 | court | 239 | `medtop:20000107` | 72 |
| 3 | appeal (court) | 671 | `medtop:20000108` | 239 |
| 3 | judge | 836 | `medtop:20000110` | 239 |
| 3 | supreme and high court | 989 | `medtop:20001287` | 239 |
| 3 | trial (court) | 1015 | `medtop:20000111` | 239 |
| 4 | litigation | 1055 | `medtop:20000114` | 1015 |
| 4 | pre-trial | 1066 | `medtop:20000112` | 1015 |
| 4 | sentencing (criminal) | 1069 | `medtop:20000134` | 1015 |
| 5 | capital punishment | 1082 | `medtop:20000135` | 1069 |
| 5 | court-ordered psychiatric treatment | 1083 | `medtop:20001198` | 1069 |
| 5 | fine (penalty) | 1084 | `medtop:20000136` | 1069 |
| 5 | prison | 1085 | `medtop:20000137` | 1069 |
| 5 | suspended sentence | 1086 | `medtop:20001199` | 1069 |
| 2 | out of court procedures | 470 | `medtop:20000116` | 72 |
| 3 | arbitration and mediation | 672 | `medtop:20000117` | 470 |
| 2 | prosecution and prosecutors | 519 | `medtop:20000118` | 72 |
| 1 | law | 75 | `medtop:20000121` | 3 |
| 2 | administrative law | 142 | `medtop:20001197` | 75 |
| 2 | civil law | 219 | `medtop:20000122` | 75 |
| 3 | regulations | 935 | `medtop:20000124` | 219 |
| 4 | antitrust regulations | 1033 | `medtop:20000123` | 935 |
| 2 | criminal law | 241 | `medtop:20000125` | 75 |
| 2 | international law | 383 | `medtop:20000126` | 75 |
| 3 | extradition | 778 | `medtop:20000127` | 383 |
| 3 | international court and tribunal | 831 | `medtop:20000128` | 383 |
| 1 | law enforcement | 76 | `medtop:20000129` | 3 |
| 2 | arrest | 161 | `medtop:20000130` | 76 |
| 2 | investigation (criminal) | 388 | `medtop:20000131` | 76 |
| 3 | dropped criminal investigation | 757 | `medtop:20001200` | 388 |
| 3 | missing person | 869 | `medtop:20000132` | 388 |
| 2 | police | 493 | `medtop:20000133` | 76 |
| 2 | surveillance | 599 | `medtop:20001299` | 76 |

### Disaster

`4` · `medtop:03000000` · disaster, accident and emergency incident · 29 topics, including this one.

| Level | Name | Id | Medtop | Parent |
| --- | --- | --- | --- | --- |
| 0 | disaster, accident and emergency incident | 4 | `medtop:03000000` |  |
| 1 | accident and emergency incident | 19 | `medtop:20000139` | 4 |
| 2 | drowning | 267 | `medtop:20001321` | 19 |
| 2 | explosion accident and incident | 299 | `medtop:20000140` | 19 |
| 2 | industrial accident and incident | 375 | `medtop:20000141` | 19 |
| 3 | nuclear accident and incident | 889 | `medtop:20000142` | 375 |
| 2 | structural failure | 594 | `medtop:20000161` | 19 |
| 2 | transportation accident and incident | 618 | `medtop:20000143` | 19 |
| 3 | air and space accident and incident | 662 | `medtop:20000144` | 618 |
| 3 | maritime accident and incident | 859 | `medtop:20000145` | 618 |
| 3 | railway accident and incident | 929 | `medtop:20000146` | 618 |
| 3 | road accident and incident | 947 | `medtop:20000147` | 618 |
| 4 | wildlife traffic accident | 1079 | `medtop:20001201` | 947 |
| 1 | disaster | 43 | `medtop:20000148` | 4 |
| 2 | famine | 301 | `medtop:20000149` | 43 |
| 2 | fire | 310 | `medtop:20000150` | 43 |
| 3 | wildfire | 1027 | `medtop:20001202` | 310 |
| 2 | natural disaster | 456 | `medtop:20000151` | 43 |
| 3 | drought | 758 | `medtop:20000152` | 456 |
| 3 | earthquake | 760 | `medtop:20000153` | 456 |
| 3 | flood | 787 | `medtop:20000154` | 456 |
| 3 | landslide | 845 | `medtop:20000155` | 456 |
| 4 | avalanche | 1035 | `medtop:20000156` | 845 |
| 3 | meteorological disaster | 865 | `medtop:20000157` | 456 |
| 4 | hurricane | 1052 | `medtop:20001280` | 865 |
| 4 | windstorms | 1081 | `medtop:20000158` | 865 |
| 3 | tsunami | 1017 | `medtop:20001353` | 456 |
| 3 | volcanic eruption | 1022 | `medtop:20000159` | 456 |
| 1 | emergency response | 53 | `medtop:20000168` | 4 |

### Weather

`5` · `medtop:17000000` · weather · 5 topics, including this one.

| Level | Name | Id | Medtop | Parent |
| --- | --- | --- | --- | --- |
| 0 | weather | 5 | `medtop:17000000` |  |
| 1 | weather forecast | 133 | `medtop:20001128` | 5 |
| 1 | weather phenomena | 134 | `medtop:20001129` | 5 |
| 1 | weather statistic | 135 | `medtop:20001130` | 5 |
| 1 | weather warning | 136 | `medtop:20001131` | 5 |

### Finance

`6` · `medtop:04000000` · economy, business and finance · 203 topics, including this one.

| Level | Name | Id | Medtop | Parent |
| --- | --- | --- | --- | --- |
| 0 | economy, business and finance | 6 | `medtop:04000000` |  |
| 1 | business enterprise | 28 | `medtop:20000349` | 6 |
| 2 | cooperative | 235 | `medtop:20001278` | 28 |
| 2 | small and medium enterprise | 575 | `medtop:20001172` | 28 |
| 2 | start-up and entrepreneurial business | 592 | `medtop:20001158` | 28 |
| 1 | business information | 29 | `medtop:20000170` | 6 |
| 2 | business financing | 189 | `medtop:20000183` | 29 |
| 3 | bankruptcy | 685 | `medtop:20000174` | 189 |
| 3 | corporate bond | 732 | `medtop:20001376` | 189 |
| 3 | crowdfunding | 739 | `medtop:20001294` | 189 |
| 3 | financially distressed company | 785 | `medtop:20000182` | 189 |
| 3 | stocks and securities | 984 | `medtop:20000396` | 189 |
| 4 | corporate dividends | 1040 | `medtop:20000177` | 984 |
| 4 | derivatives | 1044 | `medtop:20000395` | 984 |
| 4 | stock activity | 1074 | `medtop:20000186` | 984 |
| 4 | stock buyback | 1075 | `medtop:20000175` | 984 |
| 4 | stock flotation | 1076 | `medtop:20000187` | 984 |
| 2 | business governance | 190 | `medtop:20000199` | 29 |
| 3 | annual and special corporate meeting | 667 | `medtop:20000193` | 190 |
| 3 | annual report | 668 | `medtop:20000194` | 190 |
| 3 | board of directors | 697 | `medtop:20000195` | 190 |
| 3 | environmental, social and governance policy (ESG) | 772 | `medtop:20001230` | 190 |
| 3 | proxy filing | 921 | `medtop:20000181` | 190 |
| 3 | shareholder activity | 965 | `medtop:20000185` | 190 |
| 2 | business reporting and performance | 191 | `medtop:20001365` | 29 |
| 3 | corporate earnings | 733 | `medtop:20000178` | 191 |
| 3 | credit rating | 735 | `medtop:20000176` | 191 |
| 3 | financial statement | 784 | `medtop:20000180` | 191 |
| 2 | business restructuring | 192 | `medtop:20001366` | 29 |
| 3 | company spin-off | 725 | `medtop:20000197` | 192 |
| 3 | joint venture | 835 | `medtop:20000200` | 192 |
| 3 | leveraged buyout | 848 | `medtop:20000201` | 192 |
| 3 | management buyout | 857 | `medtop:20000203` | 192 |
| 3 | merger or acquisition | 863 | `medtop:20000204` | 192 |
| 2 | business strategy and marketing | 194 | `medtop:20000192` | 29 |
| 3 | client relationship management | 718 | `medtop:20001163` | 194 |
| 3 | commercial contract | 722 | `medtop:20000196` | 194 |
| 3 | economic globalisation | 763 | `medtop:20000198` | 194 |
| 3 | market research | 860 | `medtop:20000283` | 194 |
| 3 | market trend | 861 | `medtop:20000284` | 194 |
| 3 | new product or service | 884 | `medtop:20000205` | 194 |
| 3 | outsourcing | 897 | `medtop:20001295` | 194 |
| 3 | patent, copyright and trademark | 901 | `medtop:20000206` | 194 |
| 3 | product recall | 917 | `medtop:20000207` | 194 |
| 3 | public contract | 922 | `medtop:20001159` | 194 |
| 3 | research and development | 939 | `medtop:20000208` | 194 |
| 2 | human resources | 364 | `medtop:20000188` | 29 |
| 3 | executive officer | 776 | `medtop:20000190` | 364 |
| 3 | layoffs and downsizing | 846 | `medtop:20000189` | 364 |
| 1 | economy | 49 | `medtop:20000344` | 6 |
| 2 | central bank | 204 | `medtop:20000350` | 49 |
| 2 | currency | 247 | `medtop:20000355` | 49 |
| 3 | cryptocurrency | 740 | `medtop:20001279` | 247 |
| 2 | economic organisation | 273 | `medtop:20000363` | 49 |
| 2 | economic trends and indicators | 276 | `medtop:20000346` | 49 |
| 3 | consumer confidence | 728 | `medtop:20000352` | 276 |
| 3 | deflation | 744 | `medtop:20000356` | 276 |
| 3 | economic growth | 764 | `medtop:20000357` | 276 |
| 3 | employment statistics | 770 | `medtop:20000365` | 276 |
| 3 | exporting | 777 | `medtop:20000366` | 276 |
| 3 | government debt | 799 | `medtop:20000368` | 276 |
| 3 | gross domestic product | 802 | `medtop:20000359` | 276 |
| 3 | importing | 822 | `medtop:20000369` | 276 |
| 3 | industrial production | 823 | `medtop:20000360` | 276 |
| 3 | inflation | 824 | `medtop:20000370` | 276 |
| 3 | inventories | 832 | `medtop:20000361` | 276 |
| 3 | mortgages | 873 | `medtop:20000380` | 276 |
| 3 | productivity | 918 | `medtop:20000362` | 276 |
| 3 | recession | 932 | `medtop:20000383` | 276 |
| 2 | emerging market | 284 | `medtop:20000364` | 49 |
| 2 | international economic institution | 382 | `medtop:20000372` | 49 |
| 2 | international trade | 386 | `medtop:20000373` | 49 |
| 3 | balance of trade | 682 | `medtop:20000375` | 386 |
| 3 | tariff | 995 | `medtop:20000384` | 386 |
| 3 | trade agreements | 1007 | `medtop:20000374` | 386 |
| 3 | trade dispute | 1008 | `medtop:20000376` | 386 |
| 3 | trade policy | 1009 | `medtop:20000377` | 386 |
| 2 | monetary policy | 440 | `medtop:20000379` | 49 |
| 3 | interest rates | 829 | `medtop:20000371` | 440 |
| 2 | mutual funds | 450 | `medtop:20000381` | 49 |
| 2 | sharing economy | 565 | `medtop:20001171` | 49 |
| 1 | market and exchange | 79 | `medtop:20000385` | 6 |
| 2 | commodities market | 226 | `medtop:20000386` | 79 |
| 3 | energy market | 771 | `medtop:20000387` | 226 |
| 3 | metal | 864 | `medtop:20000388` | 226 |
| 2 | debt market | 256 | `medtop:20000390` | 79 |
| 2 | foreign exchange market | 317 | `medtop:20000391` | 79 |
| 2 | loan market | 408 | `medtop:20000392` | 79 |
| 1 | products and services | 95 | `medtop:20000209` | 6 |
| 2 | agriculture | 149 | `medtop:20000210` | 95 |
| 2 | business service | 193 | `medtop:20001371` | 95 |
| 3 | consultancy | 727 | `medtop:20000275` | 193 |
| 3 | employment agency | 769 | `medtop:20000276` | 193 |
| 3 | legal service | 847 | `medtop:20000282` | 193 |
| 3 | payment service | 902 | `medtop:20001164` | 193 |
| 3 | rental service | 938 | `medtop:20000290` | 193 |
| 3 | shipping and postal service | 968 | `medtop:20000291` | 193 |
| 3 | trade show or expo | 1010 | `medtop:20001136` | 193 |
| 2 | chemicals | 207 | `medtop:20000217` | 95 |
| 2 | commercial fishing | 225 | `medtop:20000213` | 95 |
| 2 | computing and information technology | 230 | `medtop:20000225` | 95 |
| 3 | computer and telecommunications hardware | 726 | `medtop:20000226` | 230 |
| 3 | satellite technology | 959 | `medtop:20000228` | 230 |
| 3 | semiconductor and electronic component | 962 | `medtop:20000230` | 230 |
| 3 | software and applications | 976 | `medtop:20000231` | 230 |
| 3 | telecommunication service | 998 | `medtop:20000233` | 230 |
| 3 | wireless technology | 1028 | `medtop:20000234` | 230 |
| 2 | construction and property | 233 | `medtop:20000235` | 95 |
| 3 | building material | 704 | `medtop:20000317` | 233 |
| 3 | commercial real estate | 723 | `medtop:20001367` | 233 |
| 3 | infrastructure projects | 826 | `medtop:20001245` | 233 |
| 3 | residential real estate | 940 | `medtop:20001368` | 233 |
| 2 | consumer goods | 234 | `medtop:20000243` | 95 |
| 3 | beverage and grocery | 690 | `medtop:20000324` | 234 |
| 3 | clothing | 719 | `medtop:20000245` | 234 |
| 3 | consumer electronics | 729 | `medtop:20001258` | 234 |
| 3 | furnishings and furniture | 794 | `medtop:20000325` | 234 |
| 3 | handicrafts | 806 | `medtop:20001160` | 234 |
| 3 | luxury good | 855 | `medtop:20000249` | 234 |
| 3 | pet product and service | 906 | `medtop:20001168` | 234 |
| 3 | tobacco and nicotine | 1004 | `medtop:20000330` | 234 |
| 3 | toy and game | 1006 | `medtop:20000254` | 234 |
| 2 | energy and resource | 289 | `medtop:20000256` | 95 |
| 3 | biofuel | 692 | `medtop:20001207` | 289 |
| 3 | coal | 720 | `medtop:20000258` | 289 |
| 3 | nuclear power | 891 | `medtop:20000265` | 289 |
| 3 | oil and gas | 893 | `medtop:20001243` | 289 |
| 4 | diesel fuel | 1045 | `medtop:20000259` | 893 |
| 4 | natural gas | 1059 | `medtop:20000263` | 893 |
| 4 | petrol | 1063 | `medtop:20000268` | 893 |
| 3 | renewable energy | 937 | `medtop:20000257` | 289 |
| 4 | geothermal power | 1048 | `medtop:20001208` | 937 |
| 4 | hydroelectric power | 1053 | `medtop:20001210` | 937 |
| 4 | solar power | 1072 | `medtop:20001209` | 937 |
| 4 | wind power | 1080 | `medtop:20001211` | 937 |
| 2 | financial service | 309 | `medtop:20001370` | 95 |
| 3 | accountancy and auditing | 658 | `medtop:20000272` | 309 |
| 3 | asset management | 678 | `medtop:20001162` | 309 |
| 3 | banking | 684 | `medtop:20000274` | 309 |
| 3 | financial advisory service | 783 | `medtop:20000280` | 309 |
| 3 | insurance | 828 | `medtop:20000279` | 309 |
| 3 | loans and lending | 849 | `medtop:20000393` | 309 |
| 3 | personal finance and investment | 904 | `medtop:20000287` | 309 |
| 3 | stock broking | 983 | `medtop:20000292` | 309 |
| 2 | forestry and timber | 318 | `medtop:20000214` | 95 |
| 2 | healthcare industry | 348 | `medtop:20001354` | 95 |
| 3 | biotechnology business | 693 | `medtop:20000218` | 348 |
| 3 | health care provider | 808 | `medtop:20000278` | 348 |
| 3 | medical equipment | 862 | `medtop:20001167` | 348 |
| 3 | pharmaceutical | 907 | `medtop:20000223` | 348 |
| 2 | manufacturing and engineering | 416 | `medtop:20000294` | 95 |
| 3 | aerospace | 661 | `medtop:20000295` | 416 |
| 3 | automotive | 681 | `medtop:20000296` | 416 |
| 3 | defence equipment | 743 | `medtop:20000297` | 416 |
| 3 | electrical appliance | 765 | `medtop:20000298` | 416 |
| 3 | heavy engineering | 810 | `medtop:20000299` | 416 |
| 3 | machine manufacturing | 856 | `medtop:20000302` | 416 |
| 3 | railway manufacturing | 930 | `medtop:20001166` | 416 |
| 3 | shipbuilding | 967 | `medtop:20000303` | 416 |
| 2 | media and entertainment industry | 423 | `medtop:20000304` | 95 |
| 3 | advertising | 660 | `medtop:20000305` | 423 |
| 3 | books and publishing | 699 | `medtop:20000306` | 423 |
| 3 | film industry | 782 | `medtop:20000307` | 423 |
| 3 | music industry | 876 | `medtop:20000308` | 423 |
| 3 | news industry | 885 | `medtop:20001372` | 423 |
| 3 | podcast | 912 | `medtop:20001369` | 423 |
| 3 | public relations | 924 | `medtop:20000312` | 423 |
| 3 | radio industry | 928 | `medtop:20000313` | 423 |
| 3 | satellite and cable service | 958 | `medtop:20000314` | 423 |
| 3 | streaming service | 985 | `medtop:20001293` | 423 |
| 3 | television industry | 1000 | `medtop:20000315` | 423 |
| 2 | metal and mineral mining and refining | 433 | `medtop:20000316` | 95 |
| 3 | precious material | 915 | `medtop:20000318` | 433 |
| 2 | plastic | 490 | `medtop:20000224` | 95 |
| 2 | sales channel | 553 | `medtop:20001289` | 95 |
| 3 | auction | 679 | `medtop:20000273` | 553 |
| 3 | retail | 945 | `medtop:20000252` | 553 |
| 4 | department store | 1043 | `medtop:20000246` | 945 |
| 4 | online shopping | 1061 | `medtop:20000247` | 945 |
| 4 | shopping district and high street | 1070 | `medtop:20001297` | 945 |
| 4 | shopping mall | 1071 | `medtop:20001296` | 945 |
| 4 | specialty store | 1073 | `medtop:20000253` | 945 |
| 3 | wholesale | 1026 | `medtop:20000255` | 553 |
| 2 | tourism and leisure industry | 615 | `medtop:20000331` | 95 |
| 3 | casinos and gambling | 713 | `medtop:20000332` | 615 |
| 3 | hotel and accommodation | 817 | `medtop:20000333` | 615 |
| 3 | recreational and sporting goods | 933 | `medtop:20000334` | 615 |
| 3 | restaurant and catering | 942 | `medtop:20000335` | 615 |
| 3 | tour operator | 1005 | `medtop:20000336` | 615 |
| 2 | transport | 617 | `medtop:20000337` | 95 |
| 3 | air transport | 663 | `medtop:20000338` | 617 |
| 3 | logistics | 850 | `medtop:20001170` | 617 |
| 3 | public transport | 925 | `medtop:20001362` | 617 |
| 3 | railway transport | 931 | `medtop:20000340` | 617 |
| 3 | road transport | 949 | `medtop:20000341` | 617 |
| 3 | shared transport | 964 | `medtop:20001364` | 617 |
| 3 | taxi and ride-hailing | 997 | `medtop:20001363` | 617 |
| 3 | waterway and maritime transport | 1025 | `medtop:20000343` | 617 |
| 2 | utilities | 627 | `medtop:20001244` | 95 |
| 3 | electricity | 766 | `medtop:20000260` | 627 |
| 3 | heating and cooling | 809 | `medtop:20001291` | 627 |
| 3 | waste management | 1023 | `medtop:20000269` | 627 |
| 3 | water supply | 1024 | `medtop:20000270` | 627 |

### Tech

`7` · `medtop:13000000` · science and technology · 56 topics, including this one.

| Level | Name | Id | Medtop | Parent |
| --- | --- | --- | --- | --- |
| 0 | science and technology | 7 | `medtop:13000000` |  |
| 1 | biomedical science | 26 | `medtop:20000710` | 7 |
| 2 | biotechnology | 180 | `medtop:20000711` | 26 |
| 1 | mathematics | 82 | `medtop:20000715` | 7 |
| 1 | natural science | 85 | `medtop:20000717` | 7 |
| 2 | astronomy | 166 | `medtop:20000718` | 85 |
| 2 | biology | 179 | `medtop:20000719` | 85 |
| 3 | botany | 700 | `medtop:20000720` | 179 |
| 3 | genetics | 797 | `medtop:20000721` | 179 |
| 3 | palaeontology | 900 | `medtop:20000722` | 179 |
| 3 | physiology | 909 | `medtop:20000723` | 179 |
| 3 | zoology | 1032 | `medtop:20000724` | 179 |
| 2 | chemistry | 208 | `medtop:20000725` | 85 |
| 2 | cosmology | 238 | `medtop:20000726` | 85 |
| 2 | geology | 331 | `medtop:20000727` | 85 |
| 2 | horticulture | 360 | `medtop:20000728` | 85 |
| 2 | marine science | 418 | `medtop:20000729` | 85 |
| 2 | meteorology | 434 | `medtop:20000730` | 85 |
| 2 | physics | 489 | `medtop:20000731` | 85 |
| 3 | electromagnetism | 767 | `medtop:20000732` | 489 |
| 3 | nuclear physics | 890 | `medtop:20000733` | 489 |
| 4 | particle physics | 1062 | `medtop:20000734` | 890 |
| 1 | scientific institution | 108 | `medtop:20000741` | 7 |
| 1 | scientific research | 109 | `medtop:20000735` | 7 |
| 2 | medical research | 425 | `medtop:20000737` | 109 |
| 2 | scientific exploration | 554 | `medtop:20000738` | 109 |
| 3 | space exploration | 977 | `medtop:20000739` | 554 |
| 2 | scientific innovation | 555 | `medtop:20000736` | 109 |
| 2 | scientific publication | 556 | `medtop:20000740` | 109 |
| 1 | scientific standards | 110 | `medtop:20000755` | 7 |
| 1 | social sciences | 114 | `medtop:20000742` | 7 |
| 2 | anthropology | 156 | `medtop:20000743` | 114 |
| 2 | archaeology | 158 | `medtop:20000744` | 114 |
| 2 | economics | 277 | `medtop:20000745` | 114 |
| 2 | geography | 330 | `medtop:20000746` | 114 |
| 2 | history | 353 | `medtop:20000747` | 114 |
| 2 | information science | 377 | `medtop:20000748` | 114 |
| 2 | linguistics | 406 | `medtop:20000750` | 114 |
| 2 | philosophy | 488 | `medtop:20000751` | 114 |
| 2 | political science | 502 | `medtop:20000752` | 114 |
| 2 | psychology | 521 | `medtop:20000753` | 114 |
| 2 | sociology | 581 | `medtop:20000754` | 114 |
| 2 | study of law | 595 | `medtop:20000749` | 114 |
| 1 | technology and engineering | 127 | `medtop:20000756` | 7 |
| 2 | aerospace engineering | 146 | `medtop:20000757` | 127 |
| 3 | rocketry | 950 | `medtop:20000758` | 146 |
| 2 | agricultural technology | 148 | `medtop:20000759` | 127 |
| 2 | civil engineering | 218 | `medtop:20000760` | 127 |
| 2 | electronic engineering | 282 | `medtop:20000761` | 127 |
| 2 | identification technology | 369 | `medtop:20000762` | 127 |
| 2 | information technology and computer science | 378 | `medtop:20000763` | 127 |
| 3 | artificial intelligence | 675 | `medtop:20001298` | 378 |
| 2 | materials science | 421 | `medtop:20000764` | 127 |
| 2 | mechanical engineering | 422 | `medtop:20000716` | 127 |
| 2 | micro science | 435 | `medtop:20000765` | 127 |
| 3 | nanotechnology | 882 | `medtop:20000766` | 435 |

### Health

`8` · `medtop:07000000` · health · 49 topics, including this one.

| Level | Name | Id | Medtop | Parent |
| --- | --- | --- | --- | --- |
| 0 | health | 8 | `medtop:07000000` |  |
| 1 | disease and condition | 46 | `medtop:20000446` | 8 |
| 2 | cancer | 198 | `medtop:20000447` | 46 |
| 2 | communicable disease | 227 | `medtop:20000448` | 46 |
| 3 | epidemic and pandemic | 773 | `medtop:20000449` | 227 |
| 3 | viral disease | 1021 | `medtop:20000451` | 227 |
| 4 | HIV and AIDS | 1051 | `medtop:20000452` | 1021 |
| 2 | developmental disorder | 258 | `medtop:20001355` | 46 |
| 2 | heart disease | 350 | `medtop:20000454` | 46 |
| 2 | injury | 380 | `medtop:20000456` | 46 |
| 2 | medical condition | 424 | `medtop:20000457` | 46 |
| 3 | obesity | 892 | `medtop:20000460` | 424 |
| 2 | mental health and disorder | 431 | `medtop:20000458` | 46 |
| 3 | anxiety and stress | 670 | `medtop:20001357` | 431 |
| 3 | depression | 748 | `medtop:20001356` | 431 |
| 3 | eating disorder | 761 | `medtop:20000459` | 431 |
| 2 | poisoning | 492 | `medtop:20001322` | 46 |
| 1 | government health care | 62 | `medtop:20000480` | 8 |
| 1 | health facility | 64 | `medtop:20000461` | 8 |
| 2 | healthcare clinic | 347 | `medtop:20001229` | 64 |
| 2 | hospital | 361 | `medtop:20000462` | 64 |
| 1 | health insurance | 65 | `medtop:20000483` | 8 |
| 1 | health organisation | 66 | `medtop:20000463` | 8 |
| 1 | health treatment and procedure | 67 | `medtop:20000464` | 8 |
| 2 | diet | 259 | `medtop:20000465` | 67 |
| 3 | dietary supplement | 752 | `medtop:20000466` | 259 |
| 2 | drug rehabilitation | 268 | `medtop:20001219` | 67 |
| 2 | emergency care | 283 | `medtop:20001221` | 67 |
| 2 | health care approach | 346 | `medtop:20000470` | 67 |
| 3 | conventional medicine | 731 | `medtop:20000474` | 346 |
| 3 | herbal medicine | 812 | `medtop:20000471` | 346 |
| 3 | holistic medicine | 814 | `medtop:20000472` | 346 |
| 3 | traditional Chinese medicine | 1011 | `medtop:20000473` | 346 |
| 2 | medical test | 429 | `medtop:20000469` | 67 |
| 2 | non-prescription drug | 461 | `medtop:20000467` | 67 |
| 2 | prescription drug | 513 | `medtop:20000468` | 67 |
| 2 | surgery | 598 | `medtop:20001228` | 67 |
| 2 | therapy | 612 | `medtop:20000478` | 67 |
| 2 | vaccine | 628 | `medtop:20000477` | 67 |
| 1 | medical profession | 83 | `medtop:20000485` | 8 |
| 2 | medical service | 426 | `medtop:20000486` | 83 |
| 2 | medical specialisation | 427 | `medtop:20000487` | 83 |
| 3 | dentistry | 747 | `medtop:20000712` | 427 |
| 3 | eye care | 779 | `medtop:20001225` | 427 |
| 3 | paediatrics | 898 | `medtop:20000490` | 427 |
| 3 | veterinary medicine | 1019 | `medtop:20000714` | 427 |
| 2 | medical staff | 428 | `medtop:20000492` | 83 |
| 1 | private health care | 94 | `medtop:20000484` | 8 |
| 1 | public health | 96 | `medtop:20001358` | 8 |

### Environment

`9` · `medtop:06000000` · environment · 32 topics, including this one.

| Level | Name | Id | Medtop | Parent |
| --- | --- | --- | --- | --- |
| 0 | environment | 9 | `medtop:06000000` |  |
| 1 | climate change | 33 | `medtop:20000418` | 9 |
| 2 | global warming | 333 | `medtop:20000419` | 33 |
| 1 | conservation | 36 | `medtop:20000420` | 9 |
| 2 | energy saving | 291 | `medtop:20000421` | 36 |
| 2 | parks | 477 | `medtop:20000422` | 36 |
| 1 | environmental pollution | 58 | `medtop:20000424` | 9 |
| 2 | air pollution | 150 | `medtop:20000425` | 58 |
| 2 | environmental clean-up | 292 | `medtop:20000426` | 58 |
| 2 | hazardous materials | 343 | `medtop:20000427` | 58 |
| 2 | waste materials | 639 | `medtop:20000428` | 58 |
| 2 | water pollution | 641 | `medtop:20000429` | 58 |
| 1 | natural resources | 84 | `medtop:20000430` | 9 |
| 2 | energy resources | 290 | `medtop:20000431` | 84 |
| 2 | land resources | 400 | `medtop:20000432` | 84 |
| 2 | population growth | 508 | `medtop:20000435` | 84 |
| 2 | water | 640 | `medtop:20000437` | 84 |
| 1 | nature | 86 | `medtop:20000441` | 9 |
| 2 | animal | 153 | `medtop:20000500` | 86 |
| 3 | animal disease | 666 | `medtop:20000494` | 153 |
| 3 | pests | 905 | `medtop:20001318` | 153 |
| 2 | ecosystem | 278 | `medtop:20000442` | 86 |
| 2 | endangered species | 288 | `medtop:20000443` | 86 |
| 2 | flowers and plants | 313 | `medtop:20000507` | 86 |
| 3 | plant disease | 910 | `medtop:20000495` | 313 |
| 2 | forests | 319 | `medtop:20000433` | 86 |
| 2 | invasive species | 387 | `medtop:20000444` | 86 |
| 2 | mountains | 448 | `medtop:20000434` | 86 |
| 2 | oceans | 463 | `medtop:20000438` | 86 |
| 2 | rivers | 545 | `medtop:20000439` | 86 |
| 2 | wetlands | 646 | `medtop:20000440` | 86 |
| 1 | sustainability | 125 | `medtop:20001374` | 9 |

### Sport

`10` · `medtop:15000000` · sport · 211 topics, including this one.

| Level | Name | Id | Medtop | Parent |
| --- | --- | --- | --- | --- |
| 0 | sport | 10 | `medtop:15000000` |  |
| 1 | competition discipline | 35 | `medtop:20000822` | 10 |
| 2 | American football | 152 | `medtop:20000823` | 35 |
| 2 | archery | 159 | `medtop:20000824` | 35 |
| 3 | crossbow shooting | 738 | `medtop:20000825` | 159 |
| 3 | longbow | 853 | `medtop:20000826` | 159 |
| 2 | arm wrestling | 160 | `medtop:20001286` | 35 |
| 2 | artistic swimming | 164 | `medtop:20001175` | 35 |
| 3 | synchronised free routine | 992 | `medtop:20001081` | 164 |
| 3 | synchronised technical routine | 993 | `medtop:20001082` | 164 |
| 2 | athletics | 168 | `medtop:20000827` | 35 |
| 3 | cross-country run | 736 | `medtop:20000828` | 168 |
| 3 | decathlon | 742 | `medtop:20000829` | 168 |
| 3 | discus throw | 753 | `medtop:20000830` | 168 |
| 3 | hammer throw | 805 | `medtop:20000831` | 168 |
| 3 | heptathlon | 811 | `medtop:20000832` | 168 |
| 3 | high jump | 813 | `medtop:20000833` | 168 |
| 3 | hurdles | 819 | `medtop:20000834` | 168 |
| 3 | javelin throw | 833 | `medtop:20000835` | 168 |
| 3 | long distance run | 851 | `medtop:20000836` | 168 |
| 3 | long jump | 852 | `medtop:20000837` | 168 |
| 3 | middle distance run | 866 | `medtop:20000838` | 168 |
| 3 | pentathlon | 903 | `medtop:20000839` | 168 |
| 3 | pole vault | 914 | `medtop:20000840` | 168 |
| 3 | race walking | 927 | `medtop:20000841` | 168 |
| 3 | relay run | 936 | `medtop:20000842` | 168 |
| 3 | shot put | 969 | `medtop:20000843` | 168 |
| 3 | sprint run | 979 | `medtop:20000844` | 168 |
| 3 | steeplechase (athletics) | 982 | `medtop:20001242` | 168 |
| 3 | triple jump | 1016 | `medtop:20000845` | 168 |
| 2 | Australian rules football | 169 | `medtop:20000846` | 35 |
| 2 | badminton | 170 | `medtop:20000847` | 35 |
| 2 | bandy | 171 | `medtop:20000848` | 35 |
| 2 | baseball | 174 | `medtop:20000849` | 35 |
| 3 | rubberball baseball | 952 | `medtop:20000850` | 174 |
| 2 | basketball | 175 | `medtop:20000851` | 35 |
| 3 | 3x3 basketball | 655 | `medtop:20001329` | 175 |
| 2 | biathlon | 176 | `medtop:20000852` | 35 |
| 2 | billiards | 178 | `medtop:20000853` | 35 |
| 2 | bobsleigh | 181 | `medtop:20000854` | 35 |
| 2 | bodybuilding | 182 | `medtop:20001240` | 35 |
| 2 | boules | 184 | `medtop:20000855` | 35 |
| 2 | boxing | 185 | `medtop:20000856` | 35 |
| 2 | bullfighting | 187 | `medtop:20000875` | 35 |
| 2 | Canadian football | 197 | `medtop:20000876` | 35 |
| 2 | canoeing | 199 | `medtop:20000877` | 35 |
| 3 | canoe slalom | 710 | `medtop:20001330` | 199 |
| 3 | canoe sprint | 711 | `medtop:20001331` | 199 |
| 2 | casting (fishing) | 202 | `medtop:20000883` | 35 |
| 2 | cheerleading | 206 | `medtop:20001309` | 35 |
| 2 | chess | 209 | `medtop:20001154` | 35 |
| 2 | competitive dancing | 229 | `medtop:20000911` | 35 |
| 3 | breaking (breakdance) | 702 | `medtop:20001379` | 229 |
| 2 | cricket | 240 | `medtop:20000888` | 35 |
| 2 | croquet | 242 | `medtop:20000889` | 35 |
| 2 | curling | 246 | `medtop:20000890` | 35 |
| 3 | icestock sport | 821 | `medtop:20000891` | 246 |
| 2 | cycling | 250 | `medtop:20000892` | 35 |
| 3 | artistic cycling | 676 | `medtop:20000893` | 250 |
| 3 | bmx freestyle | 694 | `medtop:20001332` | 250 |
| 3 | bmx racing | 695 | `medtop:20000895` | 250 |
| 3 | cycle ball | 741 | `medtop:20000896` | 250 |
| 3 | mountain biking | 875 | `medtop:20000903` | 250 |
| 3 | road cycling | 948 | `medtop:20001333` | 250 |
| 2 | darts | 252 | `medtop:20000912` | 35 |
| 2 | diving | 264 | `medtop:20000913` | 35 |
| 3 | platform diving | 911 | `medtop:20000914` | 264 |
| 3 | springboard diving | 978 | `medtop:20000915` | 264 |
| 3 | synchronised diving | 991 | `medtop:20000916` | 264 |
| 2 | dog racing | 266 | `medtop:20000919` | 35 |
| 2 | duathlon | 270 | `medtop:20000922` | 35 |
| 2 | equestrian | 294 | `medtop:20000923` | 35 |
| 2 | eSports | 295 | `medtop:20001183` | 35 |
| 2 | fencing | 303 | `medtop:20000929` | 35 |
| 2 | field hockey | 306 | `medtop:20000933` | 35 |
| 2 | figure skating | 307 | `medtop:20000934` | 35 |
| 2 | fist ball | 311 | `medtop:20000936` | 35 |
| 2 | floorball | 312 | `medtop:20000937` | 35 |
| 2 | flying disc | 314 | `medtop:20000938` | 35 |
| 2 | football | 315 | `medtop:20001065` | 35 |
| 3 | football 5-a-side | 790 | `medtop:20001335` | 315 |
| 2 | Gaelic football | 325 | `medtop:20000939` | 35 |
| 2 | goalball | 334 | `medtop:20001336` | 35 |
| 2 | golf | 335 | `medtop:20000940` | 35 |
| 3 | mini golf | 868 | `medtop:20000941` | 335 |
| 2 | gymnastics | 340 | `medtop:20000942` | 35 |
| 3 | artistic gymnastics | 677 | `medtop:20001152` | 340 |
| 3 | rhythmic gymnastics | 946 | `medtop:20000951` | 340 |
| 3 | trampoline | 1013 | `medtop:20000955` | 340 |
| 2 | handball (team) | 341 | `medtop:20000958` | 35 |
| 2 | hornuss | 358 | `medtop:20000959` | 35 |
| 2 | horse racing | 359 | `medtop:20000960` | 35 |
| 2 | hurling | 367 | `medtop:20000964` | 35 |
| 2 | ice hockey | 368 | `medtop:20000965` | 35 |
| 3 | sledge hockey | 974 | `medtop:20000966` | 368 |
| 2 | Jai Alai (Pelota) | 390 | `medtop:20000968` | 35 |
| 2 | kabaddi | 394 | `medtop:20000978` | 35 |
| 2 | kayaking | 395 | `medtop:20000979` | 35 |
| 2 | kiting | 397 | `medtop:20001306` | 35 |
| 2 | lacrosse | 399 | `medtop:20000986` | 35 |
| 2 | luge | 415 | `medtop:20000987` | 35 |
| 2 | marathon | 417 | `medtop:20000988` | 35 |
| 2 | martial arts | 420 | `medtop:20001157` | 35 |
| 3 | judo | 837 | `medtop:20000969` | 420 |
| 3 | jukendo | 838 | `medtop:20000977` | 420 |
| 3 | karate | 839 | `medtop:20000983` | 420 |
| 3 | kendo | 840 | `medtop:20000984` | 420 |
| 3 | kickboxing | 841 | `medtop:20001310` | 420 |
| 3 | krav maga | 842 | `medtop:20001308` | 420 |
| 3 | kyudo | 843 | `medtop:20000985` | 420 |
| 3 | mixed martial arts | 870 | `medtop:20001231` | 420 |
| 3 | naginata | 881 | `medtop:20001009` | 420 |
| 3 | sambo (martial art) | 957 | `medtop:20001311` | 420 |
| 3 | Taekwon-Do | 994 | `medtop:20001084` | 420 |
| 3 | wushu | 1030 | `medtop:20001102` | 420 |
| 2 | modern pentathlon | 439 | `medtop:20000989` | 35 |
| 2 | motor car racing | 443 | `medtop:20000991` | 35 |
| 2 | motorboat racing | 444 | `medtop:20000990` | 35 |
| 2 | motorcycling | 445 | `medtop:20000998` | 35 |
| 2 | mountain climbing | 446 | `medtop:20000884` | 35 |
| 3 | ice climbing | 820 | `medtop:20000885` | 446 |
| 2 | mountaineering | 447 | `medtop:20000886` | 35 |
| 2 | netball | 458 | `medtop:20001010` | 35 |
| 2 | orienteering | 469 | `medtop:20001011` | 35 |
| 3 | ski orienteering | 973 | `medtop:20001012` | 469 |
| 2 | padel | 472 | `medtop:20001305` | 35 |
| 2 | parachuting | 473 | `medtop:20001013` | 35 |
| 2 | polo | 504 | `medtop:20001014` | 35 |
| 2 | pool | 505 | `medtop:20001015` | 35 |
| 2 | power boating | 511 | `medtop:20001016` | 35 |
| 2 | racquetball | 527 | `medtop:20001281` | 35 |
| 2 | ringette | 543 | `medtop:20001282` | 35 |
| 2 | rodeo | 547 | `medtop:20001017` | 35 |
| 3 | bareback bronc | 687 | `medtop:20001018` | 547 |
| 3 | barrel racing | 688 | `medtop:20001019` | 547 |
| 3 | bull riding | 705 | `medtop:20001020` | 547 |
| 3 | bulldogging | 706 | `medtop:20001021` | 547 |
| 3 | calf roping | 709 | `medtop:20001022` | 547 |
| 3 | goat roping | 798 | `medtop:20001023` | 547 |
| 3 | saddle bronc | 956 | `medtop:20001024` | 547 |
| 2 | roller sports | 548 | `medtop:20001155` | 35 |
| 3 | roller hockey | 951 | `medtop:20001025` | 548 |
| 3 | skateboarding | 970 | `medtop:20001156` | 548 |
| 2 | rowing | 549 | `medtop:20001026` | 35 |
| 2 | rugby | 551 | `medtop:20001176` | 35 |
| 3 | rugby league | 953 | `medtop:20001035` | 551 |
| 3 | rugby sevens | 954 | `medtop:20001037` | 551 |
| 3 | rugby union | 955 | `medtop:20001036` | 551 |
| 2 | sailing | 552 | `medtop:20001038` | 35 |
| 2 | sepak takraw | 560 | `medtop:20001047` | 35 |
| 2 | shinty | 567 | `medtop:20001048` | 35 |
| 2 | short track speed skating | 569 | `medtop:20001151` | 35 |
| 2 | skeleton | 571 | `medtop:20001055` | 35 |
| 2 | skiing | 572 | `medtop:20001056` | 35 |
| 3 | alpine skiing | 664 | `medtop:20001057` | 572 |
| 3 | cross-country skiing | 737 | `medtop:20001149` | 572 |
| 3 | freestyle skiing | 792 | `medtop:20001058` | 572 |
| 3 | grass skiing | 800 | `medtop:20001059` | 572 |
| 3 | Nordic combined | 888 | `medtop:20001150` | 572 |
| 3 | ski jumping | 971 | `medtop:20001061` | 572 |
| 3 | ski mountaineering | 972 | `medtop:20001390` | 572 |
| 3 | Telemark skiing | 999 | `medtop:20001153` | 572 |
| 2 | sky diving | 573 | `medtop:20001062` | 35 |
| 2 | snooker | 576 | `medtop:20001063` | 35 |
| 2 | snowboarding | 577 | `medtop:20001064` | 35 |
| 2 | softball | 582 | `medtop:20001066` | 35 |
| 2 | speed skating | 583 | `medtop:20001067` | 35 |
| 2 | sport climbing | 584 | `medtop:20000887` | 35 |
| 2 | sport shooting | 585 | `medtop:20001049` | 35 |
| 2 | squash | 590 | `medtop:20001068` | 35 |
| 2 | stand up paddleboarding (SUP) | 591 | `medtop:20001307` | 35 |
| 2 | sumo wrestling | 596 | `medtop:20001069` | 35 |
| 2 | surfing | 597 | `medtop:20001070` | 35 |
| 2 | swimming | 600 | `medtop:20001071` | 35 |
| 3 | marathon swimming | 858 | `medtop:20001077` | 600 |
| 2 | table tennis | 602 | `medtop:20001083` | 35 |
| 2 | ten pin bowling | 607 | `medtop:20001086` | 35 |
| 2 | tennis | 608 | `medtop:20001085` | 35 |
| 2 | track cycling | 616 | `medtop:20001334` | 35 |
| 2 | triathlon | 621 | `medtop:20001087` | 35 |
| 2 | tug-of-war | 622 | `medtop:20001088` | 35 |
| 2 | underwater sports | 623 | `medtop:20000918` | 35 |
| 2 | volleyball | 631 | `medtop:20001089` | 35 |
| 3 | beach volleyball | 689 | `medtop:20001090` | 631 |
| 2 | water polo | 642 | `medtop:20001091` | 35 |
| 2 | water skiing | 643 | `medtop:20001092` | 35 |
| 2 | weightlifting and powerlifting | 645 | `medtop:20001093` | 35 |
| 2 | windsurfing | 647 | `medtop:20001097` | 35 |
| 2 | wrestling | 651 | `medtop:20001098` | 35 |
| 3 | freestyle wrestling | 793 | `medtop:20001099` | 651 |
| 3 | greco-roman | 801 | `medtop:20001100` | 651 |
| 3 | Swiss wrestling | 990 | `medtop:20001101` | 651 |
| 1 | disciplinary action in sport | 44 | `medtop:20001103` | 10 |
| 1 | drug use in sport | 48 | `medtop:20001104` | 10 |
| 1 | sport achievement | 115 | `medtop:20001301` | 10 |
| 2 | sports honour | 586 | `medtop:20001304` | 115 |
| 2 | sports medal and trophy | 587 | `medtop:20001303` | 115 |
| 2 | sports record | 589 | `medtop:20001302` | 115 |
| 1 | sport event | 116 | `medtop:20001108` | 10 |
| 2 | final game | 308 | `medtop:20001343` | 116 |
| 2 | Olympic Games | 464 | `medtop:20001177` | 116 |
| 2 | Paralympic Games | 474 | `medtop:20001178` | 116 |
| 2 | playoff championship | 491 | `medtop:20001342` | 116 |
| 2 | regular competition | 538 | `medtop:20001341` | 116 |
| 1 | sport industry | 117 | `medtop:20001124` | 10 |
| 1 | sport organisation | 118 | `medtop:20001125` | 10 |
| 1 | sport venue | 119 | `medtop:20001126` | 10 |
| 1 | sports coaching | 120 | `medtop:20001323` | 10 |
| 1 | sports management and ownership | 121 | `medtop:20001324` | 10 |
| 1 | sports officiating | 122 | `medtop:20001325` | 10 |
| 1 | sports transaction | 123 | `medtop:20001148` | 10 |

### Arts

`11` · `medtop:01000000` · arts, culture, entertainment and media · 73 topics, including this one.

| Level | Name | Id | Medtop | Parent |
| --- | --- | --- | --- | --- |
| 0 | arts, culture, entertainment and media | 11 | `medtop:01000000` |  |
| 1 | arts and entertainment | 23 | `medtop:20000002` | 11 |
| 2 | animation | 155 | `medtop:20000003` | 23 |
| 2 | cartoon | 201 | `medtop:20000004` | 23 |
| 2 | cinema | 216 | `medtop:20000005` | 23 |
| 2 | dance | 251 | `medtop:20000007` | 23 |
| 3 | ballet | 683 | `medtop:20000008` | 251 |
| 3 | modern dance | 871 | `medtop:20000009` | 251 |
| 3 | traditional dance | 1012 | `medtop:20000010` | 251 |
| 2 | fashion | 302 | `medtop:20000011` | 23 |
| 3 | cosmetics | 734 | `medtop:20001248` | 302 |
| 3 | hairstyles | 803 | `medtop:20001249` | 302 |
| 3 | jewellery | 834 | `medtop:20000012` | 302 |
| 2 | festival | 304 | `medtop:20001181` | 23 |
| 3 | film festival | 781 | `medtop:20000006` | 304 |
| 2 | literature | 407 | `medtop:20000013` | 23 |
| 3 | drama (literature) | 754 | `medtop:20000014` | 407 |
| 3 | fiction | 780 | `medtop:20000015` | 407 |
| 3 | non-fiction | 887 | `medtop:20000016` | 407 |
| 3 | poetry | 913 | `medtop:20000017` | 407 |
| 2 | music | 449 | `medtop:20000018` | 23 |
| 3 | musical genre | 878 | `medtop:20000021` | 449 |
| 4 | children's music | 1037 | `medtop:20001189` | 878 |
| 4 | classical music | 1038 | `medtop:20000022` | 878 |
| 4 | country music | 1041 | `medtop:20000023` | 878 |
| 4 | dance band music | 1042 | `medtop:20001187` | 878 |
| 4 | electronic dance music | 1046 | `medtop:20001188` | 878 |
| 4 | folk music | 1047 | `medtop:20000024` | 878 |
| 4 | heavy metal | 1049 | `medtop:20001186` | 878 |
| 4 | hip hop | 1050 | `medtop:20001184` | 878 |
| 4 | jazz music | 1054 | `medtop:20000025` | 878 |
| 4 | popular music | 1065 | `medtop:20000026` | 878 |
| 4 | r&b | 1067 | `medtop:20001185` | 878 |
| 4 | rock and roll music | 1068 | `medtop:20000027` | 878 |
| 3 | musical instrument | 879 | `medtop:20000019` | 449 |
| 3 | musical performance | 880 | `medtop:20000020` | 449 |
| 2 | series | 561 | `medtop:20001179` | 23 |
| 2 | theatre | 611 | `medtop:20000029` | 23 |
| 3 | cabaret | 707 | `medtop:20001191` | 611 |
| 3 | drama (theatre) | 755 | `medtop:20001180` | 611 |
| 3 | musical | 877 | `medtop:20001133` | 611 |
| 3 | opera | 894 | `medtop:20000028` | 611 |
| 3 | operetta | 895 | `medtop:20001134` | 611 |
| 3 | stand-up comedy | 980 | `medtop:20001190` | 611 |
| 2 | visual arts | 630 | `medtop:20000031` | 23 |
| 3 | architecture | 673 | `medtop:20000032` | 630 |
| 3 | design (visual arts) | 749 | `medtop:20000033` | 630 |
| 3 | drawing | 756 | `medtop:20000034` | 630 |
| 3 | forging | 791 | `medtop:20001205` | 630 |
| 3 | painting | 899 | `medtop:20000035` | 630 |
| 3 | photography | 908 | `medtop:20000036` | 630 |
| 3 | sculpture | 961 | `medtop:20000037` | 630 |
| 3 | textile arts | 1001 | `medtop:20001203` | 630 |
| 3 | woodworking | 1029 | `medtop:20001204` | 630 |
| 1 | culture | 39 | `medtop:20000038` | 11 |
| 2 | art exhibition | 163 | `medtop:20001135` | 39 |
| 2 | cultural development | 244 | `medtop:20000039` | 39 |
| 2 | customs and tradition | 248 | `medtop:20000040` | 39 |
| 2 | festive event (culture) | 305 | `medtop:20000041` | 39 |
| 2 | language | 401 | `medtop:20000042` | 39 |
| 2 | library and museum | 405 | `medtop:20000043` | 39 |
| 2 | monument and heritage site | 441 | `medtop:20000044` | 39 |
| 3 | restoration | 943 | `medtop:20000242` | 441 |
| 1 | mass media | 80 | `medtop:20000045` | 11 |
| 2 | disinformation and misinformation | 263 | `medtop:20001319` | 80 |
| 2 | news media | 459 | `medtop:20000046` | 80 |
| 2 | newspaper | 460 | `medtop:20000047` | 80 |
| 2 | online media outlet | 465 | `medtop:20000048` | 80 |
| 2 | periodical | 486 | `medtop:20000049` | 80 |
| 2 | radio | 528 | `medtop:20000050` | 80 |
| 2 | social media | 578 | `medtop:20001182` | 80 |
| 3 | influencers | 825 | `medtop:20001192` | 578 |
| 2 | television | 606 | `medtop:20000051` | 80 |

### Lifestyle

`12` · `medtop:10000000` · lifestyle and leisure · 55 topics, including this one.

| Level | Name | Id | Medtop | Parent |
| --- | --- | --- | --- | --- |
| 0 | lifestyle and leisure | 12 | `medtop:10000000` |  |
| 1 | leisure | 77 | `medtop:20000538` | 12 |
| 2 | club and association | 221 | `medtop:20000539` | 77 |
| 2 | game | 326 | `medtop:20000540` | 77 |
| 3 | board game | 696 | `medtop:20000541` | 326 |
| 3 | card game | 712 | `medtop:20000542` | 326 |
| 3 | children's game | 715 | `medtop:20000543` | 326 |
| 3 | dice game | 750 | `medtop:20000544` | 326 |
| 3 | outdoor game | 896 | `medtop:20000545` | 326 |
| 3 | puzzle | 926 | `medtop:20000546` | 326 |
| 3 | tile game | 1003 | `medtop:20000547` | 326 |
| 3 | video game | 1020 | `medtop:20000548` | 326 |
| 2 | gaming and lottery | 327 | `medtop:20000549` | 77 |
| 2 | hobby | 354 | `medtop:20000550` | 77 |
| 3 | automobile enthusiasm | 680 | `medtop:20000566` | 354 |
| 3 | bicycle enthusiasm | 691 | `medtop:20000567` | 354 |
| 3 | collecting | 721 | `medtop:20001247` | 354 |
| 3 | food and drink enthusiasm | 788 | `medtop:20000568` | 354 |
| 4 | beer, wine and spirits | 1036 | `medtop:20001254` | 788 |
| 4 | cooking and baking | 1039 | `medtop:20001253` | 788 |
| 3 | motorcycle enthusiasm | 874 | `medtop:20000571` | 354 |
| 2 | holiday | 355 | `medtop:20000551` | 77 |
| 3 | Halloween | 804 | `medtop:20001270` | 355 |
| 3 | public holiday | 923 | `medtop:20000552` | 355 |
| 4 | Midsummer | 1056 | `medtop:20001267` | 923 |
| 4 | National day | 1058 | `medtop:20001268` | 923 |
| 4 | New year | 1060 | `medtop:20001269` | 923 |
| 2 | leisure venue | 403 | `medtop:20000553` | 77 |
| 3 | amusement park | 665 | `medtop:20000554` | 403 |
| 3 | bar | 686 | `medtop:20000555` | 403 |
| 3 | cafe | 708 | `medtop:20000556` | 403 |
| 3 | nightclub | 886 | `medtop:20000557` | 403 |
| 3 | restaurant | 941 | `medtop:20000558` | 403 |
| 3 | zoo | 1031 | `medtop:20001315` | 403 |
| 2 | outdoor recreational activities | 471 | `medtop:20000560` | 77 |
| 3 | fishing | 786 | `medtop:20000561` | 471 |
| 3 | horseback riding | 816 | `medtop:20001241` | 471 |
| 3 | hunting | 818 | `medtop:20000562` | 471 |
| 3 | recreational hiking and climbing | 934 | `medtop:20001142` | 471 |
| 3 | scuba diving | 960 | `medtop:20000917` | 471 |
| 2 | travel and tourism | 619 | `medtop:20000563` | 77 |
| 1 | lifestyle | 91 | `medtop:20000565` | 12 |
| 2 | house and home | 362 | `medtop:20000570` | 91 |
| 3 | gardening | 796 | `medtop:20001257` | 362 |
| 3 | home renovation | 815 | `medtop:20001255` | 362 |
| 3 | interior decoration | 830 | `medtop:20001256` | 362 |
| 2 | organic food | 467 | `medtop:20000569` | 91 |
| 2 | party | 478 | `medtop:20001143` | 91 |
| 2 | trend | 620 | `medtop:20000572` | 91 |
| 3 | body modification | 698 | `medtop:20001250` | 620 |
| 4 | piercing | 1064 | `medtop:20001252` | 698 |
| 4 | tattooing | 1077 | `medtop:20001251` | 698 |
| 1 | wellness | 138 | `medtop:20001339` | 12 |
| 2 | exercise and fitness | 298 | `medtop:20001239` | 138 |
| 2 | mental wellbeing | 432 | `medtop:20001340` | 138 |

### Education

`13` · `medtop:05000000` · education · 23 topics, including this one.

| Level | Name | Id | Medtop | Parent |
| --- | --- | --- | --- | --- |
| 0 | education | 13 | `medtop:05000000` |  |
| 1 | curriculum | 40 | `medtop:20000412` | 13 |
| 1 | educational grading | 50 | `medtop:20001217` | 13 |
| 1 | educational testing and examinations | 51 | `medtop:20000413` | 13 |
| 1 | entrance examination | 57 | `medtop:20000414` | 13 |
| 1 | online and remote learning | 88 | `medtop:20001337` | 13 |
| 1 | parents group | 89 | `medtop:20000398` | 13 |
| 1 | religious education | 100 | `medtop:20000399` | 13 |
| 1 | school | 107 | `medtop:20000400` | 13 |
| 2 | adult and continuing education | 144 | `medtop:20000403` | 107 |
| 2 | college and university | 224 | `medtop:20000405` | 107 |
| 2 | early childhood education | 271 | `medtop:20000409` | 107 |
| 2 | independent school | 373 | `medtop:20001215` | 107 |
| 2 | lower secondary education | 414 | `medtop:20000408` | 107 |
| 2 | primary education | 514 | `medtop:20000401` | 107 |
| 2 | private school | 518 | `medtop:20001214` | 107 |
| 2 | religious school | 541 | `medtop:20001212` | 107 |
| 2 | state school | 593 | `medtop:20001213` | 107 |
| 2 | upper secondary education | 626 | `medtop:20000404` | 107 |
| 1 | social learning | 112 | `medtop:20000410` | 13 |
| 1 | students | 124 | `medtop:20000415` | 13 |
| 1 | teachers | 126 | `medtop:20000416` | 13 |
| 1 | vocational education | 131 | `medtop:20001216` | 13 |

### Labour

`14` · `medtop:09000000` · labour · 27 topics, including this one.

| Level | Name | Id | Medtop | Parent |
| --- | --- | --- | --- | --- |
| 0 | labour | 14 | `medtop:09000000` |  |
| 1 | employment | 55 | `medtop:20000509` | 14 |
| 2 | apprenticeship | 157 | `medtop:20000510` | 55 |
| 2 | child labour | 211 | `medtop:20000511` | 55 |
| 2 | commuting | 228 | `medtop:20000339` | 55 |
| 2 | employee | 285 | `medtop:20000512` | 55 |
| 2 | employer | 286 | `medtop:20000513` | 55 |
| 2 | employment training | 287 | `medtop:20000514` | 55 |
| 2 | parental leave | 475 | `medtop:20001276` | 55 |
| 2 | self-employment | 558 | `medtop:20001206` | 55 |
| 2 | volunteering | 632 | `medtop:20001277` | 55 |
| 2 | wages and benefits | 635 | `medtop:20000518` | 55 |
| 3 | profit sharing | 919 | `medtop:20001375` | 635 |
| 3 | social security | 975 | `medtop:20000520` | 635 |
| 1 | employment legislation | 56 | `medtop:20000521` | 14 |
| 2 | workplace health and safety | 650 | `medtop:20000522` | 56 |
| 1 | labour market | 73 | `medtop:20000523` | 14 |
| 2 | gig economy | 332 | `medtop:20001275` | 73 |
| 1 | labour relations | 74 | `medtop:20000524` | 14 |
| 2 | collective agreements | 223 | `medtop:20000525` | 74 |
| 2 | labour dispute | 398 | `medtop:20000529` | 74 |
| 3 | labour strike | 844 | `medtop:20000530` | 398 |
| 1 | retirement | 106 | `medtop:20000531` | 14 |
| 2 | pension | 483 | `medtop:20000532` | 106 |
| 1 | unemployment | 128 | `medtop:20000533` | 14 |
| 2 | unemployment benefits | 624 | `medtop:20000535` | 128 |
| 1 | unions | 129 | `medtop:20000536` | 14 |

### Society

`15` · `medtop:14000000` · society · 72 topics, including this one.

| Level | Name | Id | Medtop | Parent |
| --- | --- | --- | --- | --- |
| 0 | society | 15 | `medtop:14000000` |  |
| 1 | communities | 34 | `medtop:20000768` | 15 |
| 2 | fraternal and community group | 320 | `medtop:20001360` | 34 |
| 2 | social networking | 579 | `medtop:20000769` | 34 |
| 1 | demographics | 42 | `medtop:20000770` | 15 |
| 2 | population and census | 507 | `medtop:20000774` | 42 |
| 1 | discrimination | 45 | `medtop:20000775` | 15 |
| 2 | ageism | 147 | `medtop:20000776` | 45 |
| 2 | racism | 526 | `medtop:20000777` | 45 |
| 2 | religious discrimination | 540 | `medtop:20000778` | 45 |
| 2 | sexism | 562 | `medtop:20000779` | 45 |
| 1 | diversity, equity and inclusion | 47 | `medtop:20001373` | 15 |
| 1 | emigration | 54 | `medtop:20000772` | 15 |
| 1 | family | 59 | `medtop:20000780` | 15 |
| 2 | adoption | 143 | `medtop:20000781` | 59 |
| 2 | Dating and Relationships | 254 | `medtop:20000782` | 59 |
| 2 | divorce | 265 | `medtop:20000783` | 59 |
| 2 | family planning | 300 | `medtop:20000784` | 59 |
| 3 | abortion | 656 | `medtop:20000785` | 300 |
| 3 | contraception | 730 | `medtop:20001274` | 300 |
| 2 | marriage | 419 | `medtop:20000786` | 59 |
| 2 | parenting | 476 | `medtop:20000787` | 59 |
| 2 | pregnancy and childbirth | 512 | `medtop:20001359` | 59 |
| 1 | fundamental rights | 60 | `medtop:20000587` | 15 |
| 2 | censorship and freedom of speech | 203 | `medtop:20000588` | 60 |
| 2 | civil rights | 220 | `medtop:20000120` | 60 |
| 2 | freedom of religion | 322 | `medtop:20000590` | 60 |
| 2 | freedom of the press | 323 | `medtop:20000591` | 60 |
| 2 | human rights | 365 | `medtop:20000592` | 60 |
| 2 | privacy | 517 | `medtop:20001300` | 60 |
| 2 | women's rights | 649 | `medtop:20001326` | 60 |
| 1 | immigration | 70 | `medtop:20000771` | 15 |
| 2 | illegal immigration | 370 | `medtop:20000773` | 70 |
| 1 | mankind | 78 | `medtop:20000788` | 15 |
| 2 | adults | 145 | `medtop:20000789` | 78 |
| 2 | children | 212 | `medtop:20000790` | 78 |
| 2 | disabilities | 261 | `medtop:20000791` | 78 |
| 2 | gender | 328 | `medtop:20000793` | 78 |
| 2 | indigenous people | 374 | `medtop:20001288` | 78 |
| 2 | infants | 376 | `medtop:20000794` | 78 |
| 2 | LGBTQ | 404 | `medtop:20000792` | 78 |
| 2 | men | 430 | `medtop:20001328` | 78 |
| 2 | national or ethnic minority | 454 | `medtop:20000795` | 78 |
| 2 | senior citizens | 559 | `medtop:20000797` | 78 |
| 2 | teenagers | 605 | `medtop:20000798` | 78 |
| 2 | women | 648 | `medtop:20001327` | 78 |
| 1 | social condition | 111 | `medtop:20000799` | 15 |
| 2 | homelessness | 356 | `medtop:20000800` | 111 |
| 2 | poverty | 510 | `medtop:20000801` | 111 |
| 1 | social problem | 113 | `medtop:20000802` | 15 |
| 2 | abusive behaviour | 139 | `medtop:20000803` | 113 |
| 2 | addiction | 141 | `medtop:20000804` | 113 |
| 2 | bullying | 188 | `medtop:20001284` | 113 |
| 2 | juvenile delinquency | 393 | `medtop:20000805` | 113 |
| 2 | prostitution | 520 | `medtop:20000806` | 113 |
| 2 | sexual misconduct | 564 | `medtop:20001193` | 113 |
| 2 | slavery | 574 | `medtop:20000807` | 113 |
| 1 | values | 130 | `medtop:20000808` | 15 |
| 2 | death and dying | 255 | `medtop:20000810` | 130 |
| 3 | euthanasia | 775 | `medtop:20000811` | 255 |
| 4 | assisted suicide | 1034 | `medtop:20000812` | 775 |
| 3 | suicide | 986 | `medtop:20000813` | 255 |
| 2 | ethics | 296 | `medtop:20000814` | 130 |
| 2 | pornography | 509 | `medtop:20000815` | 130 |
| 2 | sexual behaviour | 563 | `medtop:20000816` | 130 |
| 1 | welfare | 137 | `medtop:20000817` | 15 |
| 2 | charity | 205 | `medtop:20000818` | 137 |
| 2 | child care | 210 | `medtop:20001317` | 137 |
| 2 | elderly care | 281 | `medtop:20001232` | 137 |
| 2 | long-term care | 413 | `medtop:20000819` | 137 |
| 2 | public housing | 522 | `medtop:20001290` | 137 |
| 2 | social services | 580 | `medtop:20000820` | 137 |

### Religion

`16` · `medtop:12000000` · religion · 51 topics, including this one.

| Level | Name | Id | Medtop | Parent |
| --- | --- | --- | --- | --- |
| 0 | religion | 16 | `medtop:12000000` |  |
| 1 | belief systems | 25 | `medtop:20000657` | 16 |
| 2 | atheism and agnosticism | 167 | `medtop:20001349` | 25 |
| 2 | Buddhism | 186 | `medtop:20000658` | 25 |
| 2 | Christianity | 213 | `medtop:20000659` | 25 |
| 3 | Catholicism | 714 | `medtop:20001344` | 213 |
| 3 | Christian Orthodoxy | 716 | `medtop:20000663` | 213 |
| 3 | Mormonism | 872 | `medtop:20000661` | 213 |
| 3 | Protestantism | 920 | `medtop:20000664` | 213 |
| 2 | Confucianism | 231 | `medtop:20000673` | 25 |
| 2 | cult | 243 | `medtop:20000674` | 25 |
| 2 | Hinduism | 352 | `medtop:20000676` | 25 |
| 2 | Islam | 389 | `medtop:20000677` | 25 |
| 3 | Shia Islam | 966 | `medtop:20001347` | 389 |
| 3 | Sunni Islam | 988 | `medtop:20001348` | 389 |
| 2 | Jainism | 391 | `medtop:20000678` | 25 |
| 2 | Judaism | 392 | `medtop:20000679` | 25 |
| 3 | Hasidism | 807 | `medtop:20001351` | 392 |
| 2 | nature religion | 457 | `medtop:20000680` | 25 |
| 2 | Scientology | 557 | `medtop:20000682` | 25 |
| 2 | Shintoism | 566 | `medtop:20000683` | 25 |
| 2 | Sikhism | 570 | `medtop:20000684` | 25 |
| 2 | Taoism | 603 | `medtop:20000685` | 25 |
| 2 | Unificationism | 625 | `medtop:20000686` | 25 |
| 2 | Zoroastrianism | 654 | `medtop:20000681` | 25 |
| 1 | relations between religion and government | 98 | `medtop:20000702` | 16 |
| 1 | religious conflict | 99 | `medtop:20000688` | 16 |
| 1 | religious facility | 101 | `medtop:20000697` | 16 |
| 2 | church | 215 | `medtop:20000698` | 101 |
| 2 | mosque | 442 | `medtop:20000699` | 101 |
| 2 | synagogue | 601 | `medtop:20000700` | 101 |
| 1 | religious festival and holiday | 102 | `medtop:20000690` | 16 |
| 2 | All Saints Day | 151 | `medtop:20001271` | 102 |
| 2 | Christmas | 214 | `medtop:20000691` | 102 |
| 2 | Easter | 272 | `medtop:20000692` | 102 |
| 2 | Eid al-Adha | 280 | `medtop:20001350` | 102 |
| 2 | Hanukkah | 342 | `medtop:20001352` | 102 |
| 2 | Pentecost | 485 | `medtop:20000693` | 102 |
| 2 | Ramadan | 529 | `medtop:20000694` | 102 |
| 2 | Walpurgis night | 636 | `medtop:20001272` | 102 |
| 2 | Yom Kippur | 652 | `medtop:20000695` | 102 |
| 1 | religious leader | 103 | `medtop:20000703` | 16 |
| 2 | pope | 506 | `medtop:20000704` | 103 |
| 1 | religious ritual | 104 | `medtop:20000696` | 16 |
| 2 | baptism | 172 | `medtop:20001273` | 104 |
| 2 | bar and bat mitzvah | 173 | `medtop:20001345` | 104 |
| 2 | canonisation | 200 | `medtop:20001346` | 104 |
| 1 | religious text | 105 | `medtop:20000705` | 16 |
| 2 | Bible | 177 | `medtop:20000706` | 105 |
| 2 | Qur'an | 525 | `medtop:20000707` | 105 |
| 2 | Torah | 613 | `medtop:20000708` | 105 |

### Human interest

`17` · `medtop:08000000` · human interest · 14 topics, including this one.

| Level | Name | Id | Medtop | Parent |
| --- | --- | --- | --- | --- |
| 0 | human interest | 17 | `medtop:08000000` |  |
| 1 | anniversary | 21 | `medtop:20001237` | 17 |
| 1 | award and prize | 24 | `medtop:20000498` | 17 |
| 1 | birthday | 27 | `medtop:20001238` | 17 |
| 1 | celebrity | 30 | `medtop:20000505` | 17 |
| 1 | ceremony | 31 | `medtop:20000501` | 17 |
| 2 | funeral and memorial service | 324 | `medtop:20001235` | 31 |
| 2 | graduation | 338 | `medtop:20001234` | 31 |
| 2 | name ceremony | 451 | `medtop:20001233` | 31 |
| 2 | wedding | 644 | `medtop:20001236` | 31 |
| 1 | high society | 68 | `medtop:20000504` | 17 |
| 2 | royalty | 550 | `medtop:20000506` | 68 |
| 1 | human mishap | 69 | `medtop:20000503` | 17 |
| 1 | record and achievement | 97 | `medtop:20000499` | 17 |

## How an article is filed

Ingestion reads the IPTC ids on the APITube item. It loads `id`, `parent_id`, and `medtop_id` from the `categories` table. That table is the only category list ingestion uses.

1. Each matching id adds that category, and every ancestor, to `article_categories`.
2. `articles.category_id` is the pin's category. If several top-level categories match, use the menu order above, Politics first and Human interest last.
3. If the item matches no row, `category_id` is `18`, the General row.

A story tagged only `medtop:20000350` (central bank) is stored on central bank and on each ancestor through Finance. APITube does not do that rollup. The parent links in `categories` do.

This read lands with `apps/ingestion`. It is not in the gateway.

## Schema

The SQL is `infra/migrations/0001_news_categories.sql`. Leave `0000_create_articles.sql` as it is. The Drizzle tables in `packages/db` match that file. The gateway reads `category_id`. That read works in Neon after the migrate job on `develop` applies `0001`.

```text
categories
  id           integer identity PK     6 for Finance, 204 for central bank
  name         text                    Finance on a menu row, central bank on a subcategory
  parent_id    integer nullable        null on a menu row, 6 on economy, 49 on central bank
  medtop_id    text unique             medtop:04000000, null on general

articles
  category_id  integer → categories.id    the pin's category, or 18 for General

article_categories
  article_id   uuid → articles.id
  category_id  integer → categories.id    the matched topic and each ancestor
  PRIMARY KEY (article_id, category_id)
```

The seed inserts every id by hand, parents before children, then sets the sequence to `max(id)` so the next category receives the following integer. `articles.category` today is a check constraint of `Finance`, `Tech`, `Geopolitics`, and `General`. This replaces that column with `category_id`. `Geopolitics` becomes `1`. The seed is every row in the lists above.

Index `article_categories (category_id)` and `articles (category_id, published_at DESC)`.

## Endpoints

The category filter is one integer. It may be a menu category or any subcategory. An unknown integer on the globe is a 400. A non-numeric value is a 400.

```text
GET /api/categories
GET /api/categories/11
GET /api/categories/11/articles?limit=20
GET /api/spatial/news?bbox=west,south,east,north&categoryId=6
GET /api/spatial/news?bbox=west,south,east,north&categoryId=204
POST /api/spatial/news/live
```

`11` is Arts. `6` is Finance. `204` is central bank.

`GET /api/categories` returns the seventeen categories and General: `id`, `name`, `medtopId`, and `childCount`.

`GET /api/categories/:id` returns that category, its parent, and its direct children. The reader opens `11`, sees arts and entertainment (`23`), opens that, and sees music (`449`). A missing integer is a 404.

`GET /api/categories/:id/articles` returns the newest articles filed under that id, including every topic beneath it, with no bounding box. `limit` defaults to `CATEGORY_ARTICLES_DEFAULT` and caps at `CATEGORY_ARTICLES_CAP`. Both vars are in `apps/gateway/wrangler.toml`.

`GET /api/spatial/news` keeps `bbox`. `categoryId` is the integer. Omitting it returns every category in the box. The spatial query and the live seal share one predicate: the article has a row in `article_categories` for that integer. The seal body is `{ bbox, categoryId? }`.

A pin returns the menu category and every topic the article was filed under, root first:

```json
{
  "categoryId": 6,
  "categories": [
    { "id": 6, "name": "Finance" },
    { "id": 49, "name": "economy" },
    { "id": 204, "name": "central bank" }
  ]
}
```

`GET /api/articles/:id` returns the same pair. `POST /api/articles/:id/live` stays a subscription for one article. `POST /api/spatial/news/live` seals the same `categoryId` predicate as the spatial GET, so a music subscription does not receive a later story that is only tagged as sport.

These reads come from our database. APITube remains the ingest source. Ingestion resolves IPTC ids from `categories` when that app is built. `Geopolitics` from the old column becomes `1`.
