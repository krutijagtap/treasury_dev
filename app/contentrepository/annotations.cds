using CatalogService as service from '../../srv/cat-service';

annotate service.Content with @(
  UI.LineItem #repo       : [
    {
      $Type                : 'UI.DataField',
      Value                : mediaType,
      ![@HTML5.CssDefaults]: {width: 'auto'},
    },
    {
      $Type                : 'UI.DataField',
      Label                : 'Tag Type',
      Value                : tagType_code,
      ![@HTML5.CssDefaults]: {width: 'auto'},
    },
    {
      $Type                : 'UI.DataField',
      Value                : createdBy,
      ![@HTML5.CssDefaults]: {width: 'auto'},
    },
    {
      $Type                : 'UI.DataField',
      Value                : createdAt,
      ![@HTML5.CssDefaults]: {width: 'auto'},
    },
  ],
  UI.SelectionFields #repo: [mediaType],
);

annotate service.Content with @(UI.SelectionPresentationVariant #approvedOnly: {
  $Type              : 'UI.SelectionPresentationVariantType',
  PresentationVariant: {
    $Type         : 'UI.PresentationVariantType',
    Visualizations: ['@UI.LineItem#repo']
  },
  SelectionVariant   : {
    $Type        : 'UI.SelectionVariantType',
    SelectOptions: [{
      $Type       : 'UI.SelectOptionType',
      PropertyName: status_code,
      Ranges      : [{
        Sign  : #I,
        Option: #EQ,
        Low   : 'APPROVED'
      }]
    }]
  },
  Text               : 'Approved'
});
