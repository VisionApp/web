import * as React from "react";
import { createMyContext } from "../../../lib/createMyContext";
import { KeyResult } from "../models/KeyResult";
import { Objective } from "../models/Objective";
import type { ColumnsType } from "antd/lib/table/interface";
import { getColumnConfig } from "../columnConfig";
import { message } from "antd";
import { Cycle } from "../models/Cycle";
import { OKR } from "../models/OKR";

const initialObjective = new Objective();

function useVision(props: {}) {
  const okr = React.useRef(new OKR());
  const curCycle = React.useRef<Cycle>();

  const [key, setKey] = React.useState(0);
  const [exportModalVisible, setExportModalVisible] = React.useState(false);
  const [importModalVisible, setImportModalVisible] = React.useState(false);
  const [keyResultModalVisible, setKeyResultModalVisible] = React.useState(
    false
  );
  const [cyclesModalVisible, setCyclesModalVisible] = React.useState(false);
  const curKeyResultDetail = React.useRef<KeyResult>();

  function forceRender() {
    setTimeout(() => setKey((s) => s + 1), 0);
  }

  function createCycle() {
    const cycle = new Cycle();
    okr.current.cycles.push(cycle);
    curCycle.current = cycle;

    forceRender();
  }

  function mutateCycle(cycle: Cycle | ((cycle: Cycle) => Cycle)) {
    if (!curCycle.current) return;

    if (typeof cycle === "function") {
      cycle = cycle(curCycle.current);
    }
    curCycle.current = cycle;

    forceRender();
  }

  const columns: ColumnsType = getColumnConfig({
    handleDelete,
    onKeyResultEditClick: (kr) => {
      curKeyResultDetail.current = kr;
      setKeyResultModalVisible(true);
    },
  }).map((col) => {
    if (!col.editable) {
      return col;
    }

    return {
      ...col,
      onCell: (record) => ({
        record,
        editable: col.editable,
        dataIndex: col.dataIndex,
        title: col.title,
        handleSave: handleEdit,
      }),
    };
  });

  function handleDelete(keyResult: KeyResult) {
    mutateCycle((cycle) => {
      const index = cycle.findIndexByKeyResult(keyResult);
      cycle.objectives[index].deleteKeyResult(keyResult);

      return cycle;
    });
  }

  function handleEdit(keyResult: KeyResult) {
    mutateCycle((cycle) => {
      const index = cycle.findIndexByKeyResult(keyResult);
      cycle.objectives[index].editKeyResult(keyResult);

      return cycle;
    });
  }

  function handleAddKR(objective?: Objective) {
    mutateCycle((cycle) => {
      const isExistedObjective = objective != null;

      if (!isExistedObjective) {
        objective = cycle.objectives.length
          ? new Objective()
          : initialObjective;
      }
      const keyResult = new KeyResult();
      keyResult.objective = objective!;
      objective!.linkKeyResults(keyResult);

      if (!isExistedObjective) {
        cycle.objectives.push(objective!);
      }

      return cycle;
    });
  }

  function handleImportChange(value: string) {
    try {
      mutateCycle(Cycle.fromJSONString(value));
    } catch {
      message.error("Your JSON string is invalid!");
    }
  }

  return {
    curCycle,
    mutateCycle,
    forceRender,
    columns,
    key,
    exportModalVisible,
    setExportModalVisible,
    importModalVisible,
    setImportModalVisible,
    handleImportChange,
    keyResultModalVisible,
    setKeyResultModalVisible,
    cyclesModalVisible,
    setCyclesModalVisible,
    curKeyResultDetail,
    handleAddKR,
    createCycle,
  };
}

export const {
  Provider,
  useContext,
  Context: { Consumer },
} = createMyContext<
  Parameters<typeof useVision>[0],
  ReturnType<typeof useVision>
>(useVision);
