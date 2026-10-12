(function () {
  "use strict";

  // Démonstration locale : cette liste pourra être remplacée par une projection VASTE.
  window.VESTIGES_EXPLORATION_ITEMS = Object.freeze([
    { id: "marqueterie", title: "Marqueterie", type: "Savoir-faire", shortDescription: "Assembler de fines pièces de bois pour créer une image ou un motif.", image: null, relatedIds: ["bois", "art-deco", "gravure"] },
    { id: "dentelle", title: "Dentelle", type: "Savoir-faire", shortDescription: "Former un motif en nouant ou en croisant des fils.", image: null, relatedIds: ["textile", "teinture", "art-deco"] },
    { id: "forge", title: "Forge", type: "Technique", shortDescription: "Façonner le métal en le chauffant puis en le frappant.", image: null, relatedIds: ["bronze", "sculpture", "mouvement"] },
    { id: "ceramique", title: "Céramique", type: "Technique", shortDescription: "Façonner la terre, la recouvrir parfois d’un émail, puis la cuire.", image: null, relatedIds: ["mosaïque", "periode", "verre"] },
    { id: "verre", title: "Verre soufflé", type: "Savoir-faire", shortDescription: "Chauffer le verre puis le souffler pour le façonner avant qu’il ne refroidisse.", image: null, relatedIds: ["ceramique", "mosaïque", "art-deco"] },
    { id: "bois", title: "Bois", type: "Matière", shortDescription: "Une matière que l’on peut travailler, assembler, graver ou sculpter.", image: null, relatedIds: ["marqueterie", "sculpture", "gravure"] },
    { id: "textile", title: "Textile", type: "Matière", shortDescription: "On peut tisser, teindre ou réparer un tissu pour le transformer.", image: null, relatedIds: ["dentelle", "teinture", "mouvement"] },
    { id: "bronze", title: "Bronze", type: "Matière", shortDescription: "Un métal que l’on peut faire fondre et verser dans un moule pour créer une pièce ou une sculpture.", image: null, relatedIds: ["forge", "sculpture", "periode"] },
    { id: "art-deco", title: "Art déco", type: "Style", shortDescription: "Un style décoratif aux lignes géométriques, visible dans les objets et les bâtiments.", image: null, relatedIds: ["marqueterie", "dentelle", "verre"] },
    { id: "teinture", title: "Teinture", type: "Technique", shortDescription: "Colorer des fils ou un tissu en les plongeant dans un bain.", image: null, relatedIds: ["textile", "dentelle", "periode"] },
    { id: "gravure", title: "Gravure", type: "Technique", shortDescription: "Marquer ou creuser une surface pour créer une image, un motif ou un texte.", image: null, relatedIds: ["bois", "marqueterie", "mouvement"] },
    { id: "mosaïque", title: "Mosaïque", type: "Objet", shortDescription: "Créer une image ou un décor en assemblant de petits morceaux de pierre, de verre ou de céramique.", image: null, relatedIds: ["ceramique", "verre", "periode"] }
  ]);
}());
