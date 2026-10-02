/**
 * Join extracted datasets. Does not classify scenarios and does not invent
 * alignments or source relations. Missing records stay null.
 */
export function indexById(groups) {
  const map = new Map();
  for (const group of groups) {
    for (const id of group.ids) {
      map.set(id, {
        code_tag: group.code_tag,
        code_label: group.code_label,
        paper_letter: group.paper_letter,
      });
    }
  }
  return map;
}

export function flattenSceneCards(sceneDoc) {
  const scenes = [];
  for (const category of sceneDoc.categories) {
    for (const scenario of category.scenarios) {
      scenes.push({
        ...scenario,
        category_id: category.id,
        category_label: category.label,
        category_description: category.description,
      });
    }
  }
  return scenes;
}

export function joinCatalog(sceneDoc, alignmentDoc, relationDoc) {
  const relations = indexById(relationDoc.groups);
  return flattenSceneCards(sceneDoc).map((scenario) => ({
    ...scenario,
    source_relation: relations.get(scenario.id) ?? null,
    published_alignment: alignmentDoc.annotations?.[scenario.id] ?? null,
  }));
}
