using CatalogService as service from '../../srv/cat-service';

annotate service.Content with @UI.LineItem: [
    {
        $Type                : 'UI.DataField',
        Label                : 'File Name',
        Value                : fileName,
        ![@HTML5.CssDefaults]: {width: 'auto', }
    },
    {
        $Type                : 'UI.DataField',
        Label                : 'Media Type',
        Value                : mediaType,
        ![@HTML5.CssDefaults]: {width: 'auto', }
    },
    // {
    //             $Type: 'UI.DataField',
    //             Label: 'Tag Type',
    //             Value: tagType,
    //     ![@HTML5.CssDefaults]: {width: 'auto', }
    // },
    {
                $Type: 'UI.DataField',
                Label: 'Status Code',
                Value: status,
        ![@HTML5.CssDefaults]: {width: 'auto', }
    },
    // {
    //             $Type: 'UI.DataField',
    //             Label: 'Embedding Status Code',
    //             Value: embeddingStatus,
    //     ![@HTML5.CssDefaults]: {width: 'auto', }
    // },
    {
        $Type                : 'UI.DataField',
        Label                : 'Content',
        Value                : content,
        ![@HTML5.CssDefaults]: {width: 'auto', }
    },
    {
                $Type: 'UI.DataField',
                Label: 'Created By',
                Value: createdBy,
        ![@HTML5.CssDefaults]: {width: 'auto', }
    },
    {
                $Type: 'UI.DataField',
                Label: 'Changed By',
                Value: modifiedBy,
        ![@HTML5.CssDefaults]: {width: 'auto', }
    },
    // { $Type: 'UI.DataField', Value: metaData,  @UI.Hidden  : true },  
    {
        $Type                : 'UI.DataFieldForAction',
        Action               : 'CatalogService.approveContent',
        Label                : 'Approve',
        Inline               : true,
        Criticality          : #Positive,
        ![@HTML5.CssDefaults]: {width: 'auto'},
        @UI.Hidden           : {$edmJson: {$Not: {$Eq: [
            {$Path: 'status'},
            'SUBMITTED'
        ]}}},
        // ![@UI.Hidden]        : {$edmJson: {$Not: {$And: [
        //     {$Eq: [
        //         {$Path: 'status'},
        //         'SUBMITTED'
        //     ]},
        //     {$Path: 'isChecker'}
        // ]}}},
        InvocationGrouping   : #Isolated,
    },
    {
        $Type                : 'UI.DataFieldForAction',
        Action               : 'CatalogService.rejectContent',
        Label                : 'Reject',
        Inline               : true,
        Criticality          : #Negative,
        ![@HTML5.CssDefaults]: {width: 'auto'},
        @UI.Hidden           : {$edmJson: {$Not: {$Eq: [
            {$Path: 'status'},
            'SUBMITTED'
        ]}}},
        // ![@UI.Hidden]        : {$edmJson: {$Not: {$And: [
        //     {$Eq: [
        //         {$Path: 'status'},
        //         'SUBMITTED'
        //     ]},
        //     {$Path: 'isChecker'}
        // ]}}},
        InvocationGrouping   : #Isolated
    },
    {
        $Type                : 'UI.DataFieldForAction',
        Action               : 'CatalogService.deleteContent',
        IconUrl              : 'sap-icon://delete',
        Inline               : true,
        ![@HTML5.CssDefaults]: {width: 'auto'},
        // @UI.Hidden           : {$edmJson: {$Not: {$Eq: [
        //     {$Path: 'status'},
        //     'SUBMITTED'
        // ]}}},
        // ![@UI.Hidden]        : {$edmJson: {$Not: {$And: [
        //     {$Eq: [
        //         {$Path: 'status'},
        //         'SUBMITTED'
        //     ]},
        //     {$Path: 'isChecker'}
        // ]}}},
        InvocationGrouping   : #Isolated
    }
// UI.Facets                    : [{
//     $Type : 'UI.ReferenceFacet',
//     ID    : 'GeneratedFacet1',
//     Label : 'General Information',
//     Target: '@UI.FieldGroup#GeneratedGroup',
// }, ],
// UI.LineItem#QA                 : [
//     {
//         $Type                : 'UI.DataField',
//         Label                : 'Uploaded Files',
//         Value                : fileName,
//         ![@HTML5.CssDefaults]: {width: 'auto'}
//     },
//     {
//         $Type                : 'UI.DataField',
//         Label                : 'Approval Status',
//         Value                : status,
//         ![@HTML5.CssDefaults]: {width: 'auto'}
//     },
//     {
//         $Type                : 'UI.DataField',
//         Label                : 'Media Type',
//         Value                : mediaType,
//         ![@HTML5.CssDefaults]: {width: 'auto'}
//     },
//     {
//         $Type                : 'UI.DataField',
//         Value                : createdBy,
//         ![@HTML5.CssDefaults]: {width: 'auto'}
//     },
//     {
//         $Type                : 'UI.DataField',
//         Label                : 'Created On',
//         Value                : createdAt,
//         ![@HTML5.CssDefaults]: {width: 'auto'}
//     }

// ],
//  UI.LineItem#Sum              : [
//     {
//         $Type                : 'UI.DataField',
//         Label                : 'Uploaded Files',
//         Value                : fileName,
//         ![@HTML5.CssDefaults]: {width: 'auto'}
//     },
//     {
//         $Type                : 'UI.DataField',
//         Label                : 'Approval Status',
//         Value                : status,
//         ![@HTML5.CssDefaults]: {width: 'auto'}
//     },
//     {
//         $Type                : 'UI.DataField',
//         Label                : 'Media Type',
//         Value                : mediaType,
//         ![@HTML5.CssDefaults]: {width: 'auto'}
//     },
//     {
//         $Type                : 'UI.DataField',
//         Value                : createdBy,
//         ![@HTML5.CssDefaults]: {width: 'auto'}
//     },
//     {
//         $Type                : 'UI.DataField',
//         Label                : 'Created On',
//         Value                : createdAt,
//         ![@HTML5.CssDefaults]: {width: 'auto'}
//     },
//     {
//         $Type                : 'UI.DataFieldForAction',
//         Action               : 'CatalogService.submit',
//         Label                : 'Submit',
//         Criticality          : #Neutral,
//         ![@UI.Hidden]        : {$edmJson: {$Not: {$And: [
//             {$Eq: [
//                 {$Path: 'tagType_code'},
//                 'SUMMARY'
//             ]},
//             {$Eq: [
//                 {$Path: 'status'},
//                 'DRAFT'
//             ]}
//         ]}}},
//         Inline               : true,
//         ![@HTML5.CssDefaults]: {width: 'auto'},
//         ![@UI.Importance]    : #High,

//     }

// ],
//     UI.LineItem#QAInbox             : [
//     {
//         $Type                : 'UI.DataField',
//         Label                : 'Uploaded Files',
//         Value                : fileName,
//         ![@HTML5.CssDefaults]: {width: 'auto'}
//     },
//     {
//         $Type                : 'UI.DataField',
//         Label                : 'Approval Status',
//         Value                : status,
//         ![@HTML5.CssDefaults]: {width: 'auto'}
//     },
//     {
//         $Type                : 'UI.DataField',
//         Label                : 'Media Type',
//         Value                : mediaType,
//         ![@HTML5.CssDefaults]: {width: 'auto'}
//     },
//     {
//         $Type                : 'UI.DataField',
//         Value                : createdBy,
//         ![@HTML5.CssDefaults]: {width: 'auto'}
//     },
//     {
//         $Type                : 'UI.DataField',
//         Label                : 'Created On',
//         Value                : createdAt,
//         ![@HTML5.CssDefaults]: {width: 'auto'}
//     },

//     {
//         $Type                : 'UI.DataFieldForAction',
//         Action               : 'CatalogService.approveContent',
//         Label                : 'Approve',
//         Inline               : true,
//         Criticality          : #Positive,
//         ![@HTML5.CssDefaults]: {width: 'auto'},
//         ![@UI.Hidden]        : {$edmJson: {$Not: {$And: [
//             {$Eq: [
//                 {$Path: 'status'},
//                 'SUBMITTED'
//             ]},
//             {$Path: 'isChecker'}
//         ]}}},
//         InvocationGrouping   : #Isolated,
//     },
//     {
//         $Type                : 'UI.DataFieldForAction',
//         Action               : 'CatalogService.rejectContent',
//         Label                : 'Reject',
//         Inline               : true,
//         Criticality          : #Negative,
//         ![@HTML5.CssDefaults]: {width: 'auto'},
//         ![@UI.Hidden]        : {$edmJson: {$Not: {$And: [
//             {$Eq: [
//                 {$Path: 'status'},
//                 'SUBMITTED'
//             ]},
//             {$Path: 'isChecker'}
//         ]}}},
//         InvocationGrouping   : #Isolated
//     }

// ],
//  UI.LineItem#SumInbox           : [
//     {
//         $Type                : 'UI.DataField',
//         Label                : 'Uploaded Files',
//         Value                : fileName,
//         ![@HTML5.CssDefaults]: {width: 'auto'}
//     },
//     {
//         $Type                : 'UI.DataField',
//         Label                : 'Approval Status',
//         Value                : status,
//         ![@HTML5.CssDefaults]: {width: 'auto'}
//     },
//     {
//         $Type                : 'UI.DataField',
//         Label                : 'Media Type',
//         Value                : mediaType,
//         ![@HTML5.CssDefaults]: {width: 'auto'}
//     },
//     {
//         $Type                : 'UI.DataField',
//         Value                : createdBy,
//         ![@HTML5.CssDefaults]: {width: 'auto'}
//     },
//     {
//         $Type                : 'UI.DataField',
//         Label                : 'Created On',
//         Value                : createdAt,
//         ![@HTML5.CssDefaults]: {width: 'auto'}
//     },
//     {
//         $Type                : 'UI.DataFieldForAction',
//         Action               : 'CatalogService.approveContent',
//         Label                : 'Approve',
//         Inline               : true,
//         Criticality          : #Positive,
//         ![@HTML5.CssDefaults]: {width: 'auto'},
//         ![@UI.Hidden]        : {$edmJson: {$Not: {$And: [
//             {$Eq: [
//                 {$Path: 'status'},
//                 'SUBMITTED'
//             ]},
//             {$Path: 'isChecker'}
//         ]}}},
//         InvocationGrouping   : #Isolated,
//     },
//     {
//         $Type                : 'UI.DataFieldForAction',
//         Action               : 'CatalogService.rejectContent',
//         Label                : 'Reject',
//         Inline               : true,
//         Criticality          : #Negative,
//         ![@HTML5.CssDefaults]: {width: 'auto'},
//         ![@UI.Hidden]        : {$edmJson: {$Not: {$And: [
//             {$Eq: [
//                 {$Path: 'status'},
//                 'SUBMITTED'
//             ]},
//             {$Path: 'isChecker'}
//         ]}}},
//         InvocationGrouping   : #Isolated
//     }

// ],
];

annotate service.Content with @(
    UI.SelectionPresentationVariant #qa          : {
        $Type              : 'UI.SelectionPresentationVariantType',
        PresentationVariant: {$Type: 'UI.PresentationVariantType'},
        SelectionVariant   : {
            $Type        : 'UI.SelectionVariantType',
            SelectOptions: [{
                $Type       : 'UI.SelectOptionType',
                PropertyName: tagType,
                Ranges      : [{
                    Sign  : #I,
                    Option: #EQ,
                    Low   : 'QA'
                }],
            }],
        },
        Text               : 'Q&A',
        @UI.Hidden         : true
    },
    UI.SelectionPresentationVariant #summary     : {
        $Type              : 'UI.SelectionPresentationVariantType',
        PresentationVariant: {$Type: 'UI.PresentationVariantType'},
        SelectionVariant   : {
            $Type        : 'UI.SelectionVariantType',
            SelectOptions: [{
                $Type       : 'UI.SelectOptionType',
                PropertyName: tagType,
                Ranges      : [{
                    Sign  : #I,
                    Option: #EQ,
                    Low   : 'SUMMARY'
                }]
            }],
        },
        Text               : 'Summary',
        @UI.Hidden         : true
    },
    UI.SelectionPresentationVariant #qainbox     : {
        $Type              : 'UI.SelectionPresentationVariantType',
        PresentationVariant: {$Type: 'UI.PresentationVariantType'},
        SelectionVariant   : {
            $Type        : 'UI.SelectionVariantType',
            SelectOptions: [{
                $Type       : 'UI.SelectOptionType',
                PropertyName: tagType,
                Ranges      : [{
                    Sign  : #I,
                    Option: #EQ,
                    Low   : 'QA'
                }]
            }],
        },
        Text               : 'Q&A',
        @UI.Hidden         : true
    },
    UI.SelectionPresentationVariant #summaryinbox: {
        $Type              : 'UI.SelectionPresentationVariantType',
        PresentationVariant: {$Type: 'UI.PresentationVariantType'},
        SelectionVariant   : {
            $Type        : 'UI.SelectionVariantType',
            SelectOptions: [
                {
                    $Type       : 'UI.SelectOptionType',
                    PropertyName: tagType,
                    Ranges      : [{
                        Sign  : #I,
                        Option: #EQ,
                        Low   : 'SUMMARY'
                    }]
                },
                {
                    $Type       : 'UI.SelectOptionType',
                    PropertyName: status,
                    Ranges      : [{
                        Sign  : #I,
                        Option: #NE,
                        Low   : 'DRAFT'
                    }]
                }
            ]
        },
        Text               : 'Summary Inbox',
        @UI.Hidden         : true
    }
);

annotate service.Content with {
    mediaType @Common.Label: 'Media Type'
};

annotate service.Content with {
    status @Common.Label: 'Status Code'
};
