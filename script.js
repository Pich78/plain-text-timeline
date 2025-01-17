(async () => {
    document.addEventListener('DOMContentLoaded', function() {
        const directoryInput = document.getElementById('directoryInput');
        const loadButton = document.getElementById('loadButton');
        const timelineDiv = document.getElementById('timeline');
        const modal = document.getElementById('modal');
        const modalContent = document.getElementById('modal-content');
        const closeModal = document.getElementById('close-modal');

        closeModal.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        let timeline = null;

        loadButton.addEventListener('click', () => {
           directoryInput.click();
        });

        directoryInput.addEventListener('change', async () => {
            const files = Array.from(directoryInput.files);
            const yamlFiles = files.filter(file => file.name.endsWith(".yaml") || file.name.endsWith(".yml"));
            if (yamlFiles.length === 0) {
                alert("No YAML files found in the selected folder.");
                return;
            }

            const {timelineData, deadlineData} = await loadAndParseYAML(yamlFiles);
            if (timelineData.length > 0 || deadlineData.length > 0) {
                renderTimeline(timelineData, deadlineData);
            } else {
                timelineDiv.innerHTML = "<p>No valid data found in selected files.</p>";
            }
         });

        async function loadAndParseYAML(files) {
            const timelineData = [];
            const deadlineData = [];
            for (const file of files) {
                try {
                    const fileContent = await file.text();
                    const yamlData = jsyaml.load(fileContent);
                    if (yamlData) {
                        if (yamlData.type === "deadline") {
                            deadlineData.push(yamlData);
                        } else {
                            timelineData.push(yamlData);
                        }
                    } else {
                        console.warn(`File ${file.name} did not contain parseable YAML data.`);
                    }
                } catch (e) {
                    console.error(`Error processing file ${file.name}:`, e);
                }
            }
            return {
                timelineData: timelineData.sort((a, b) => new Date(a.date) - new Date(b.date)),
                deadlineData: deadlineData.sort((a, b) => new Date(a.date) - new Date(b.date))
            };
        }

       function renderTimeline(timelineData, deadlineData) {
            timelineDiv.innerHTML = "";
             const groups = [];
             const items = [];
            const colorMap = {};
            const colors = ['#f9f9f9', '#e8f5e9', '#fbe9e7', '#ede7f6', '#fff3e0', '#e0f7fa', '#f0f4c3'];
             let colorIndex = 0;
              let groupId = 0;

            const groupedData = groupEvents(timelineData);

            for (const groupName in groupedData) {
                 const color = getColorForGroup(groupName);
                groups.push({
                     id: groupId,
                     content: groupName,
                    style: `background-color: ${color}`
                  });

                groupedData[groupName].forEach(item => {
                    items.push({
                        id: items.length,
                        group: groupId,
                        start: new Date(item.date),
                        content: `<h3>${item.title}</h3><p>${item.description}</p>`
                   });
                });
                groupId++;
           }

            const options = {
                groupOrder: 'content'
            };

            timeline = new vis.Timeline(timelineDiv, items, groups, options);
            timeline.on('onload', () => {
                console.log("timeline loaded")
                deadlineData.forEach(item => {
                     if (item.date && item.title && item.description) {
                           const deadlineDate = new Date(item.date);
                          console.log("deadlineDate", deadlineDate)
                            if(isNaN(deadlineDate.getTime())){
                                console.error("Invalid date", item.date);
                                return;
                             }
                           const customTimeId = timeline.addCustomTime(deadlineDate);
                           console.log("customTimeId", customTimeId)
                            timeline.setCustomTimeTitle(customTimeId, `Deadline: ${item.title}`);


                            const customTimeElement = timelineDiv.querySelector(`.vis-custom-time[data-id='${customTimeId}']`);
                            console.log("customTimeElement", customTimeElement)
                            customTimeElement.addEventListener('mouseenter', () => {
                                   customTimeElement.title = item.description
                            });

                            customTimeElement.addEventListener('click', () => {
                                   modalContent.innerHTML = `
                                <h2>${item.title}</h2>
                                <p><strong>Date:</strong> ${new Date(item.date).toLocaleDateString()}</p>
                                <p>${item.description}</p>
                            `;
                            modal.style.display = 'block';
                        });
                    }
              });
           })
     }

        function groupEvents(data) {
            const groups = {};
            data.forEach(item => {
                const group = item.group || "undefined";
                if (!groups[group]) {
                    groups[group] = [];
               }
               groups[group].push(item);
           });
            return groups;
        }

        function getColorForGroup(groupName) {
             const colorMap = {};
            const colors = ['#f9f9f9', '#e8f5e9', '#fbe9e7', '#ede7f6', '#fff3e0', '#e0f7fa', '#f0f4c3'];
            let colorIndex = 0;
             if (!colorMap[groupName]) {
                  colorMap[groupName] = colors[colorIndex % colors.length];
                 colorIndex++;
            }
            return colorMap[groupName];
        }
    });
})();