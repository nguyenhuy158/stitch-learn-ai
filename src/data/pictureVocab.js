// Picture-dictionary vocab sets extracted from the Oxford Picture Dictionary.
// Each JSON file is one topic; illustrations live in R2 (bucket `ai-english-vocab`),
// referenced by `r2_key` and served through /api/vocab-image/<key>.
//
// Add a line here when a new topic JSON lands — esbuild can't glob-import a directory.
import everydayLanguageColors from "./vocab-everyday-language-colors.json";
import everydayLanguageMoney from "./vocab-everyday-language-money.json";
import peopleAgePhysical from "./vocab-people-age-physical-description.json";
import housingAHouse from "./vocab-housing-a-house.json";
import foodFruit from "./vocab-food-fruit.json";
import clothingI from "./vocab-clothing-clothing-i.json";
import healthTheBody from "./vocab-health-the-body.json";
import communityCityStreets from "./vocab-community-city-streets.json";
import transportationCarsTrucks from "./vocab-transportation-cars-and-trucks.json";
import areasOfStudyGeography from "./vocab-areas-of-study-geography.json";
import plantsAnimalsFlowers from "./vocab-plants-and-animals-flowers.json";
import workJobsAH from "./vocab-work-jobs-and-occupations-a-h.json";
import recreationTheBeach from "./vocab-recreation-the-beach.json";
import recreationIndividualSports from "./vocab-recreation-individual-sports.json";
import everydayLanguageWeather from "./vocab-everyday-language-weather.json";
import everydayLanguageDescribingThings from "./vocab-everyday-language-describing-things.json";
import foodVegetables from "./vocab-food-vegetables.json";
import foodMeatAndPoultry from "./vocab-food-meat-and-poultry.json";
import foodContainersAndPackagedFoods from "./vocab-food-containers-and-packaged-foods.json";
import clothingShoesAndAccessories from "./vocab-clothing-shoes-and-accessories.json";
import housingCleaningSupplies from "./vocab-housing-cleaning-supplies.json";
import housingHouseholdPests from "./vocab-housing-household-pests.json";
import housingWeightsAndMeasures from "./vocab-housing-weights-and-measures.json";
import plantsAnimalsDomesticAnimalsAndRodents from "./vocab-plants-and-animals-domestic-animals-and-rodents.json";
import workToolsAndBuildingSupplies from "./vocab-work-tools-and-building-supplies.json";
import everydayLanguage100PhrasesA1 from "./phrases/vocab-everyday-language-100-phrases-a1.json";

// Ordered by the dictionary's own chapter order.
export const PICTURE_VOCAB_TOPICS = [
  everydayLanguageColors,
  everydayLanguageMoney,
  everydayLanguageWeather,
  everydayLanguageDescribingThings,
  everydayLanguage100PhrasesA1,
  peopleAgePhysical,
  housingAHouse,
  housingCleaningSupplies,
  housingHouseholdPests,
  housingWeightsAndMeasures,
  foodFruit,
  foodVegetables,
  foodMeatAndPoultry,
  foodContainersAndPackagedFoods,
  clothingI,
  clothingShoesAndAccessories,
  healthTheBody,
  communityCityStreets,
  transportationCarsTrucks,
  areasOfStudyGeography,
  plantsAnimalsFlowers,
  plantsAnimalsDomesticAnimalsAndRodents,
  workJobsAH,
  workToolsAndBuildingSupplies,
  recreationTheBeach,
  recreationIndividualSports
];

/** All image keys we're willing to serve, so the image route can't be used to read arbitrary R2 objects. */
export const KNOWN_IMAGE_KEYS = new Set(
  PICTURE_VOCAB_TOPICS.flatMap((topic) => topic.items.map((item) => item.r2_key))
);
