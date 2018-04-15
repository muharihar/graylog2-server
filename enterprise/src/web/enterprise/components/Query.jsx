import React from 'react';
import PropTypes from 'prop-types';
import { Col } from 'react-bootstrap';

import { Spinner } from 'components/common';

import { widgetDefinition } from 'enterprise/logic/Widget';
import ViewsActions from 'enterprise/actions/ViewsActions';

import WidgetGrid from 'enterprise/components/WidgetGrid';
import { FieldList, SideBar } from 'enterprise/components/sidebar';

const _onPositionsChange = (positions, view, queryId) => {
  const newPositions = {};
  positions.forEach(({ col, height, row, width, id }) => {
    newPositions[id] = { col, height, row, width };
  });
  const updatedView = view.update('positions', (p) => {
    p[queryId] = newPositions;
    return p;
  });
  ViewsActions.update(updatedView.get('id'), updatedView);
};

const _renderWidgetGrid = (widgetDefs, widgetMapping, searchTypes, view, fields, queryId) => {
  const widgets = {};
  const data = {};

  widgetDefs.forEach((widgetDef) => {
    const widget = Object.assign({}, widgetDef.toJS());
    const widgetType = widgetDefinition(widget.type);
    const dataTransformer = widgetType.searchResultTransformer || (x => x);
    const widgetData = (widgetMapping[widgetDef.get('id')] || []).map(searchTypeId => searchTypes[searchTypeId]);
    if (widgetData) {
      widgets[widget.id] = widget;
      data[widget.id] = dataTransformer(widgetData, widgetDef.toJS());
    }
  });
  const positions = view.get('positions')[queryId];
  return (
    <WidgetGrid fields={fields}
                locked={false}
                widgets={widgets}
                positions={positions}
                data={data}
                onPositionsChange={p => _onPositionsChange(p, view, queryId)} />
  );
};

const Query = ({ fields, results, selectedFields, view, widgetMapping, widgets, query }) => {
  if (results) {
    const queryId = query.get('id');
    const viewId = view.get('id');
    const widgetGrid = _renderWidgetGrid(widgets, widgetMapping, results.searchTypes, view, fields, queryId);
    return (
      <span>
        <Col md={3} style={{ paddingLeft: 0, paddingRight: 10 }}>
          <SideBar viewId={viewId} queryId={queryId} view={view} results={results}>
            {({ maximumHeight }) => (
              <FieldList selectedFields={selectedFields}
                         maximumHeight={maximumHeight}
                         fields={fields} />
            )}
          </SideBar>
        </Col>
        <Col md={9}>
          {widgetGrid}
        </Col>
      </span>
    );
  }

  return <Spinner />;
};

Query.propTypes = {
  fields: PropTypes.object.isRequired,
  onToggleMessages: PropTypes.func.isRequired,
  results: PropTypes.object.isRequired,
  selectedFields: PropTypes.object.isRequired,
  showMessages: PropTypes.bool.isRequired,
  view: PropTypes.object.isRequired,
  widgetMapping: PropTypes.object.isRequired,
  widgets: PropTypes.object.isRequired,
  query: PropTypes.object.isRequired,
};

export default Query;
