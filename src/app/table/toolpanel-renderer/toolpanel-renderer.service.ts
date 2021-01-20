import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { IToolPanelParams } from 'ag-grid-community';

import { IAppState } from '@shared/interface/app.interface';
import { changeSelectionStatus, selectAllRowsCount, selectSelectedRowsCount, selectSelectionState } from '@store/table';
import { TABLE_SELECTION_COLUMN_ID } from '@shared/const/table.const';

@Injectable()
export class ToolpanelRendererService {
  allRowsCount$: Observable<number>;
  hasSelection$: Observable<boolean>;
  selectedRowsCount$: Observable<number>;
  withSelection = false;

  constructor(private store: Store<IAppState>) {
    this.hasSelection$ = this.store.select(selectSelectionState).pipe(
      map((hasSelection: boolean) => {
        this.withSelection = hasSelection;
        return this.withSelection;
      })
    );
    this.allRowsCount$ = this.store.select(selectAllRowsCount);
    this.selectedRowsCount$ = this.store.select(selectSelectedRowsCount);
  }

  switchSelection(params: IToolPanelParams) {
    const payload = {
      hasSelection: !this.withSelection,
    };
    const newColumnsState = {
      state: [
        {
          colId: TABLE_SELECTION_COLUMN_ID,
          hide: !payload.hasSelection,
        },
      ],
    };
    if (!payload.hasSelection) {
      params.api.deselectAll();
    }
    params.columnApi.applyColumnState(newColumnsState);
    this.store.dispatch(changeSelectionStatus({ payload }));
  }
}
