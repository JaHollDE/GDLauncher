module.exports = {
  new: [
    {
      header: "Das Overlay kann nun neugestartet werden.",
      content: "Es gibt drei Möglichkeiten, das Overlay nun neuzustarten: \n- Unten Rechts in der Symbolleiste\n- Unten links im Launcher neben der Anzahl der Spieler, die Online sind\n- Rechtsklick auf die Instanz > Overlay neustarten",
      advanced: {}
    }
  ],
  improvements: [
    {
      header: 'Mods werden nun über ihre Hash-Werte validiert.',
      content: 'Das heißt für die Hacker unter euch: Ihr könnt nicht einfach eine Mod mit dem gleichen Dateinamen in den Ordner packen :D',
      advanced: {}
    }
  ],
  bugfixes: [
    {
      header: 'Mods mit einem ungültigen Namen werden automatisch gelöscht.',
      content: '@FCKJohni',
      advanced: {}
      //advanced: { cm: '391dd9cc', pr: '1412' }
    },
    {
      header: 'Das Argument `fabric.addmods` wurde als Startoption ausgeschlossen.',
      content: '@FCKJohni',
      advanced: {}
    }
  ]
};
