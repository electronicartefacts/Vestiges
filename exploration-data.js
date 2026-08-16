(function () {
  "use strict";

  // Démonstration locale : cette liste pourra être remplacée par une projection VASTE.
  window.VESTIGES_EXPLORATION_ITEMS = Object.freeze([
    { id: "marqueterie", title: "Marqueterie", type: "Savoir-faire", shortDescription: "Assembler des essences de bois pour faire apparaître une image, une surface ou un rythme.", image: null, relatedIds: ["bois", "art-deco", "gravure"] },
    { id: "dentelle", title: "Dentelle", type: "Savoir-faire", shortDescription: "Construire un motif ajouré par la tension du fil, le geste et le temps.", image: null, relatedIds: ["textile", "teinture", "art-deco"] },
    { id: "forge", title: "Forge", type: "Technique", shortDescription: "Donner une forme au métal par la chaleur, le choc et la reprise.", image: null, relatedIds: ["bronze", "sculpture", "mouvement"] },
    { id: "ceramique", title: "Céramique", type: "Technique", shortDescription: "Transformer une terre par le façonnage, l’émail et le feu.", image: null, relatedIds: ["mosaïque", "periode", "verre"] },
    { id: "verre", title: "Verre soufflé", type: "Savoir-faire", shortDescription: "Mettre la matière en mouvement avant que le refroidissement ne fixe sa forme.", image: null, relatedIds: ["ceramique", "mosaïque", "art-deco"] },
    { id: "bois", title: "Bois", type: "Matière", shortDescription: "Une matière vivante, travaillée, assemblée, gravée ou sculptée selon les usages.", image: null, relatedIds: ["marqueterie", "sculpture", "gravure"] },
    { id: "textile", title: "Textile", type: "Matière", shortDescription: "Fibre, trame, couleur et réparation : la matière se lit aussi dans ses transformations.", image: null, relatedIds: ["dentelle", "teinture", "mouvement"] },
    { id: "bronze", title: "Bronze", type: "Matière", shortDescription: "Alliage, patine et fonte composent des histoires de forme et de circulation.", image: null, relatedIds: ["forge", "sculpture", "periode"] },
    { id: "art-deco", title: "Art déco", type: "Mouvement", shortDescription: "Un langage de lignes, de matières et de fabrication qui circule entre objets et lieux.", image: null, relatedIds: ["marqueterie", "dentelle", "verre"] },
    { id: "teinture", title: "Teinture", type: "Technique", shortDescription: "Fixer une couleur dans la fibre, par une succession de bains, de recettes et de gestes.", image: null, relatedIds: ["textile", "dentelle", "periode"] },
    { id: "gravure", title: "Gravure", type: "Technique", shortDescription: "Inscrire une surface pour multiplier, transmettre ou transformer une image.", image: null, relatedIds: ["bois", "marqueterie", "mouvement"] },
    { id: "mosaïque", title: "Mosaïque", type: "Objet", shortDescription: "Composer une image à partir de fragments, de joints et de temporalités superposées.", image: null, relatedIds: ["ceramique", "verre", "periode"] }
  ]);
}());
