# Xml-Grid

## FetchXML Sample: Contact with Linked Account

This FetchXML query retrieves contact information along with the linked account details (name and account number) using an outer join.

```xml
<fetch>
  <entity name="contact">
    <!-- Columns -->
    <attribute name="contactid" />
    <attribute name="firstname" />
    <attribute name="lastname" />
    <attribute name="emailaddress1" />

    <!-- Link to Account entity -->
    <link-entity name="account" from="accountid" to="parentcustomerid" alias="acc" link-type="outer">
      <attribute name="name" />
      <attribute name="accountnumber" />
    </link-entity>
  </entity>
</fetch>
