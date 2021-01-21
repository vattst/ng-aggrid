import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  ColDef,
  GetContextMenuItemsParams,
  GridOptions,
  MenuItemDef,
  PaginationChangedEvent,
  RowSelectedEvent,
  SideBarDef,
} from 'ag-grid-community';

import {
  CONTEXT_MENU,
  TABLE_GRID_CONFIG,
  TABLE_RENDERERS,
  TABLE_TITLE,
  YOUTUBE_DATA_URL,
} from '@shared/const/table.const';
import { IAppState } from '@shared/interface/app.interface';
import { ITableRowData } from '@shared/interface/table.interface';
import {
  addTableData,
  selectSelectionState,
  selectTableData,
  setAllRowsCount,
  setIsLinkProp,
  setSelectedRowsCount,
} from '@store/table';
import { HttpHelperService } from '@shared/helper/http-helper.service';
import { ThumbnailRendererComponent } from './thumbnail-renderer/thumbnail-renderer.component';
import { SelectionCellComponent } from './selection-cell/selection-cell.component';
import { SelectionHeaderRendererComponent } from './selection-header-renderer/selection-header-renderer.component';
import { ToolpanelRendererComponent } from './toolpanel-renderer/toolpanel-renderer.component';

@Injectable()
export class TableService {
  tableDataUrl: string = YOUTUBE_DATA_URL;

  constructor(private store: Store<IAppState>, private httpHelper: HttpHelperService) {}

  setTableData(): void {
    this.httpHelper
      .httpGetRequest(this.tableDataUrl)
      .pipe(
        map((response: any): { content: ITableRowData[] } => ({
          content: (response?.items || []).map(({ snippet, id }: any) => ({
            thumbnail: snippet.thumbnails.default,
            publishedAt: snippet.publishedAt,
            title: snippet.title,
            description: snippet.description,
            videoId: id.videoId,
          })),
        })),
        catchError(() => [])
      )
      .subscribe(
        (data) => {
          this.store.dispatch(addTableData({ payload: data }));
        },
        (err) => console.error('getTableData Error: ', err.message)
      );
  }

  getTableData(): Observable<ITableRowData[]> {
    return this.store.select(selectTableData);
  }

  getTableHasSelection(): Observable<boolean> {
    return this.store.select(selectSelectionState);
  }

  getTableGridOptions(): GridOptions {
    const gridOptions: any = { ...TABLE_GRID_CONFIG.gridOptions };
    gridOptions.onPaginationChanged = this.paginationChangedHandler.bind(this);
    gridOptions.onRowSelected = this.rowSelectedHandler.bind(this);

    return gridOptions;
  }

  getTableSideBar(): SideBarDef {
    return { ...TABLE_GRID_CONFIG.sideBar };
  }

  getTableFrameworkComponents(): any {
    return {
      [TABLE_RENDERERS.thumbnail]: ThumbnailRendererComponent,
      [TABLE_RENDERERS.selectionCell]: SelectionCellComponent,
      [TABLE_RENDERERS.selectionHeader]: SelectionHeaderRendererComponent,
      [TABLE_RENDERERS.toolPanel]: ToolpanelRendererComponent,
    };
  }

  getTableTitle(): string {
    return TABLE_TITLE;
  }

  getTableColumnDefs(): ColDef[] {
    return TABLE_GRID_CONFIG.columnDefs;
  }

  getTableContextMenuItems(params: GetContextMenuItemsParams): (string | MenuItemDef)[] {
    const columnId = params.column?.getColId();
    const isLink = params.node?.data?.thumbnail?.isLink;
    const defaultMenu = [...CONTEXT_MENU.defaultMenu];
    const advancedMenuItem = {
      name: CONTEXT_MENU.additionalItemName,
      action: () => {
        const id = params?.node?.data?.videoId;
        const payload = {
          videoId: id,
          isLinkFlag: !isLink,
        };

        this.store.dispatch(setIsLinkProp({ payload }));
      },
      checked: isLink,
    };

    if (columnId === CONTEXT_MENU.columnIdWithAddItem) {
      return [advancedMenuItem, ...defaultMenu];
    }
    return defaultMenu;
  }

  private paginationChangedHandler(event: PaginationChangedEvent): void {
    const allRowsCount = event.api.getDisplayedRowCount() || 0;
    const payload = {
      allRowsCount,
    };
    this.store.dispatch(setAllRowsCount({ payload }));
  }

  private rowSelectedHandler(event: RowSelectedEvent): void {
    const refreshParams = {
      rowNodes: [event.node],
      columns: ['checkbox'],
      force: true,
    };
    const selectedRowsCount = event.api.getSelectedRows()?.length || 0;
    const payload = {
      selectedRowsCount,
    };

    event.api.refreshCells(refreshParams);
    this.store.dispatch(setSelectedRowsCount({ payload }));
  }
}
