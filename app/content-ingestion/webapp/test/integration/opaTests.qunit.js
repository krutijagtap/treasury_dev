sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'com/scb/treasury/contentingestion/test/integration/FirstJourney',
		'com/scb/treasury/contentingestion/test/integration/pages/ContentList',
		'com/scb/treasury/contentingestion/test/integration/pages/ContentObjectPage'
    ],
    function(JourneyRunner, opaJourney, ContentList, ContentObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('com/scb/treasury/contentingestion') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onTheContentList: ContentList,
					onTheContentObjectPage: ContentObjectPage
                }
            },
            opaJourney.run
        );
    }
);