using CatalogService as service from '../../srv/cat-service';

annotate service.Content with @(
    UI.FieldGroup #GeneratedGroup: {
        $Type: 'UI.FieldGroupType',
        Data : [
            {
                $Type: 'UI.DataField',
                Label: 'fileName',
                Value: fileName,
            },
            {
                $Type: 'UI.DataField',
                Label: 'mediaType',
                Value: mediaType,
            },
            {
                $Type: 'UI.DataField',
                Label: 'tagType_code',
                Value: tagType_code,
            },
            {
                $Type: 'UI.DataField',
                Label: 'status_code',
                Value: status_code,
            },
            {
                $Type: 'UI.DataField',
                Label: 'embeddingStatus_code',
                Value: embeddingStatus_code,
            },
            {
                $Type: 'UI.DataField',
                Label: 'url',
                Value: url,
            },
        ],
    },
    UI.Facets                    : [{
        $Type : 'UI.ReferenceFacet',
        ID    : 'GeneratedFacet1',
        Label : 'General Information',
        Target: '@UI.FieldGroup#GeneratedGroup',
    }, ],
    UI.LineItem                  : [
        {
            $Type                : 'UI.DataField',
            Label                : 'Uploaded Files',
            Value                : fileName,
            ![@HTML5.CssDefaults]: {width: 'auto'}
        },
        {
            $Type                : 'UI.DataField',
            Label                : 'Approval Status',
            Value                : status_code,
            ![@HTML5.CssDefaults]: {width: 'auto'}
        },
        {
            $Type                : 'UI.DataField',
            Label                : 'Media Type',
            Value                : mediaType,
            ![@HTML5.CssDefaults]: {width: 'auto'}
        },
        {
            $Type                : 'UI.DataField',
            Value                : createdBy,
            ![@HTML5.CssDefaults]: {width: 'auto'}
        },
        {
            $Type                : 'UI.DataField',
            Label                : 'Created On',
            Value                : createdAt,
            ![@HTML5.CssDefaults]: {width: 'auto'}
        },
        {
            $Type                : 'UI.DataFieldForAction',
            Action               : 'CatalogService.submit',
            Label                : 'Submit',
            Criticality          : #Neutral,
            ![@UI.Hidden]        : {$edmJson: {$Not: {$And: [
                {$Eq: [
                    {$Path: 'tagType_code'},
                    'SUMMARY'
                ]},
                {$Eq: [
                    {$Path: 'status_code'},
                    'DRAFT'
                ]}
            ]}}},
            Inline               : true,
            ![@HTML5.CssDefaults]: {width: 'auto'},
            ![@UI.Importance]    : #High,

        },
        {
            $Type                : 'UI.DataFieldForAction',
            Action               : 'CatalogService.approveContent',
            Label                : 'Approve',
            Inline               : true,
            Criticality          : #Positive,
            ![@HTML5.CssDefaults]: {width: 'auto'},
            ![@UI.Hidden]        : {$edmJson: {$Not: {$And: [
                {$Eq: [
                    {$Path: 'status_code'},
                    'SUBMITTED'
                ]},
                {$Path: 'isChecker'}
            ]}}},
            InvocationGrouping   : #Isolated,
        },
        {
            $Type                : 'UI.DataFieldForAction',
            Action               : 'CatalogService.rejectContent',
            Label                : 'Reject',
            Inline               : true,
            Criticality          : #Negative,
            ![@HTML5.CssDefaults]: {width: 'auto'},
            ![@UI.Hidden]        : {$edmJson: {$Not: {$And: [
                {$Eq: [
                    {$Path: 'status_code'},
                    'SUBMITTED'
                ]},
                {$Path: 'isChecker'}
            ]}}},
            InvocationGrouping   : #Isolated
        }

    ],
    UI.SelectionFields           : [
        mediaType,
        status_code,
    ],
);

annotate service.Content with @(
    UI.SelectionPresentationVariant #qa     : {
        $Type              : 'UI.SelectionPresentationVariantType',
        PresentationVariant: {
            $Type         : 'UI.PresentationVariantType',
            Visualizations: ['@UI.LineItem',
            ],
        },
        SelectionVariant   : {
            $Type        : 'UI.SelectionVariantType',
            SelectOptions: [{
                $Type       : 'UI.SelectOptionType',
                PropertyName: tagType_code,
                Ranges      : [{
                    Sign  : #I,
                    Option: #EQ,
                    Low   : 'QA'
                }]
            }],
        },
        Text               : 'Q&A',
    },
    UI.SelectionPresentationVariant #summary: {
        $Type              : 'UI.SelectionPresentationVariantType',
        PresentationVariant: {
            $Type         : 'UI.PresentationVariantType',
            Visualizations: ['@UI.LineItem',
            ],
        },
        SelectionVariant   : {
            $Type        : 'UI.SelectionVariantType',
            SelectOptions: [{
                $Type       : 'UI.SelectOptionType',
                PropertyName: tagType_code,
                Ranges      : [{
                    Sign  : #I,
                    Option: #EQ,
                    Low   : 'SUMMARY'
                }]
            }],
        },
        Text               : 'Summary',
    }
);

annotate service.Content with {
    mediaType @Common.Label: 'Media Type'
};

annotate service.Content with {
    status @Common.Label: 'Status Code'
};
