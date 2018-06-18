Een aantal dingen kun je niet doen in het netwerk want dan gaat alles kapot.

Een message object mag geen .id bevatten. Deze wordt overschreven door het netwerk.
Een message object mag geen .type bevatten. Deze wordt overschreven door het netwerk.
Een message object mag niet van het type 'i_am_back' of 'disconnection' zijn. Je overschrijft hiermee newerk calls wat het hele netwerk om zeep helpt
