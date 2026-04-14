const MEALS=["Petit-dej","Dejeuner","Diner","Collation"];
const SPLITS=["Upper","Lower","Push","Pull","Legs","Full Body"];
const SPLIT_MUSCLES={Upper:["Pecs","Dos","Epaules","Biceps","Triceps"],Lower:["Quadriceps","Ischio","Fessiers","Mollets","Abdos"],Push:["Pecs","Epaules","Triceps"],Pull:["Dos","Biceps","Trapezes"],Legs:["Quadriceps","Ischio","Fessiers","Mollets"],FullBody:["Pecs","Dos","Epaules","Biceps","Triceps","Quadriceps","Ischio","Fessiers","Mollets","Abdos"]};
const ALL_MUSCLES=["Pecs","Dos","Epaules","Biceps","Triceps","Quadriceps","Ischio","Fessiers","Mollets","Abdos","Trapezes","Avant-bras"];
const PH_NAMES={A:"Pre-prep",B:"Deficit",F:"Remonte",C:"Reverse",D:"PDM",E:"Reset"};
const PH_MULT={A:1.0,B:0.85,F:0.92,C:0.90,D:1.075,E:0.88};
const PHC={A:'#6AEFAF',B:'#FF6B9D',F:'#4DD0E1',C:'#9F9BFF',D:'#FFB347',E:'#6C5CE7'};
const SPORT_CATEGORIES={
  cardio:["Footing","Velo","Natation","Marche","Rameur","Corde a sauter","HIIT","Elliptique","Sprint"],
  sport:["Football","Basketball","Tennis","Badminton","Volleyball","Rugby","Handball","Escalade","Ski","Surf","Roller","Danse"],
  combat:["Boxe","Judo","MMA","Karate","Taekwondo","Jiu-Jitsu","Lutte","Kickboxing","Muay Thai"]
};
let curSportType='muscu',curOtherSport='';
const MACRO_PRESETS={
  "Equilibre":{p:30,g:40,l:30},
  "High Prot":{p:40,g:35,l:25},
  "Keto":{p:25,g:5,l:70},
  "Low Fat":{p:35,g:50,l:15},
  "Zone":{p:30,g:40,l:30}
};
